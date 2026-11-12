
const { InteractionContextType, SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const {
    createConfigEngine,
    getConfigDefinitions
} = require("#functions/v2/moderation/helpers/configEngine");
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

const data = new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure server settings.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild);

function configureSubcommand(subcommand, item) {
    subcommand
        .setName(item.id.toLowerCase())
        .setDescription(item.desc.slice(0, 100));

    for (const field of item.value) {
        const name = field.id.toLowerCase();

        const description = field.desc.slice(0, 100);

        if (field.type === "bool") {
            subcommand.addBooleanOption(option =>
                option
                    .setName(name)
                    .setDescription(description)
                    .setRequired(false)
            );
        } else if (field.id === "channel") {
            subcommand.addChannelOption(option =>
                option
                    .setName(name)
                    .setDescription(description)
                    .setRequired(false)
            );
        } else if (field.id === "role") {
            subcommand.addRoleOption(option =>
                option
                    .setName(name)
                    .setDescription(description)
                    .setRequired(false)
            );
        } else if (field.type === "str") {
            subcommand.addStringOption(option =>
                option
                    .setName(name)
                    .setDescription(description)
                    .setRequired(false)
            );
        }
    }

    return subcommand;
}

function registerConfig(builder, definitions) {
    for (const item of definitions) {
        builder.addSubcommand(subcommand =>
            configureSubcommand(subcommand, item)
        );
    }

    return builder;
}

// Initialize asynchronously
const ready = (async () => {
    const definitions = await getConfigDefinitions();
    registerConfig(data, definitions);
})();

module.exports = {
    cooldown: 5,
    data,
    ready,
    async execute(interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        const { onSubmit, updateValues } = createConfigEngine(interaction);

        const definitions = await updateValues();
        const subcommand = interaction.options.getSubcommand();

        const item = definitions.find(
            item => item.id.toLowerCase() === subcommand
        );

        if (!item) {
            return await replyContainer(interaction, "Configuration Error", ["Unknown configuration option."], "warn");
        }

        const values = item.value.map(field => {
            const name = field.id.toLowerCase();

            // Special Discord option types
            if (field.id === "channel") {
                return interaction.options.getChannel(name)?.id ?? null;
            }

            if (field.id === "role") {
                return interaction.options.getRole(name)?.id ?? null;
            }

            switch (field.type) {
                case "bool":
                    return interaction.options.getBoolean(name);

                case "str":
                    return interaction.options.getString(name);

                default:
                    return null;
            }
        });

        // No options = show status.
        if (values.every(value => value === null)) {
            const status = typeof item.status === "object"
                ? Object.values(item.status).join("\n")
                : item.status;

            return await replyContainer(
                interaction,
                item.title,
                [status || "Not configured."],
                "info"
            );
        }

        // Generic validation.
        const disabling = item.value.some(
            (field, i) => field.id === "enable" && values[i] === false
        );

        for (let i = 0; i < item.value.length; i++) {
            const field = item.value[i];

            if (disabling && field.id !== "enable") {
                continue;
            }

            if (field.required && values[i] === null) {
                return await replyContainer(
                    interaction,
                    "Configuration Error",
                    [`You must specify \`${field.id.toLowerCase()}\`.`],
                    "warn"
                );
            }
        }

        try {
            const result = await onSubmit(item, values);

            return await replyContainer(
                interaction,
                result.error ? "Configuration Error" : "Configuration Updated",
                [result.desc],
                result.error ? "warn" : "info"
            );
        } catch (error) {
            console.error("[Config]", error);

            return await replyContainer(
                interaction,
                "Configuration Error",
                ["An error occurred while updating the configuration."],
                "warn"
            );
        }
    }
};
