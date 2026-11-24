
const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

const { replyContainer } = require('#functions/discord/container/replyContainer');
const { claimChatRevive } = require('#functions/discord/moderation/databaseQueries/addChatRevive');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { log } = require('#functions/core/log.mjs');
module.exports = {
    cooldown: 5,

    data: new SlashCommandBuilder()
        .setName('chat-revive')
        .setDescription('Revive the chat in this server.')
        .setContexts(InteractionContextType.Guild)
        .addStringOption(option =>
            option
                .setName('msg')
                .setDescription('What message to append?')
                .setMaxLength(500)
        ),

    async execute(interaction) {

        // Public reply, exactly like the original command.
        await interaction.deferReply({
            withResponse: true
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        const result = await claimChatRevive(interaction);

        // Revival unavailable, disabled, or on cooldown.
        if (result.error) {
            await replyContainer(
                interaction,
                'Revive Chat',
                [result.desc],
                "warn"
            );
            return;
        }

        const userMsg = interaction.options.getString('msg');

        let description =
            `The user <@${interaction.user.id}> revived the chat!\n\n`;

        if (userMsg !== null) {
            description +=
                `Message from <@${interaction.user.id}>: ${userMsg}\n\n`;
        }

        description +=
            `-# The next ping is available <t:${result.nextAvailable}:R>.`;

        await replyContainer(
            interaction,
            'Revive Chat',
            [description],
            "info"
        );

        // Second message: configured role mention.
        try {
            await interaction.channel.send({
                content: `<@&${result.roleId}>`,
                allowedMentions: {
                    parse: [],
                    roles: [result.roleId]
                }
            });
        } catch (error) {
            log.error('Failed to send chat revive ping:', error);

            // The cooldown was already claimed.
            // Do not automatically reset it here because another
            // invocation could have changed the configuration.
        }

        return;
    }
};
