
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkPerms } = require('#functions/v2/moderation/helpers/permissionCheck');
const { replyContainer } = require("#functions/v2/discord/replyContainer");
const { containerMaker } = require('#functions/v2/moderation/helpers/containerMaker');
const { moderateContainer } = require('#functions/v2/moderation/moderateContainer');
const { queryModerationCases, liftModerationCase } = require('#functions/v2/moderation/databaseQueries/addModCase');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('liftwarn')
        .setDescription("Lift a warning for a user!")
        .addUserOption(option =>
            option
                .setName("user")
                .setRequired(true)
                .setDescription("The user whose warning will be lifted.")
        )
        .addIntegerOption(option =>
            option
                .setName("case")
                .setRequired(true)
                .setMinValue(1)
                .setDescription("The warning case ID to lift.")
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason to lift warning.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const targetUser = interaction.options.getUser("user", true);
        const caseId = interaction.options.getInteger("case", true);
        const targetMember =
            interaction.options.getMember("user") ??
            await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        let reason;
        if (interaction.options.getString('reason') == null) {
            reason = "No reason given.";
        } else {
            reason = interaction.options.getString('reason');
        }

        const perms = await checkPerms(interaction, "warn", targetUser, targetMember);
        if (perms.error) {
            await replyContainer(interaction, "Warns", [perms.desc], "warn");
            return;
        }

        // Verify that this case belongs to the selected user.
        const query = await queryModerationCases(interaction, targetUser.id, "warn");

        if (query.error) {
            await replyContainer(interaction, "Error", [query.desc], "warn");
            return;
        }

        const warning = query.cases.find(
            item => item.caseId === caseId
        );

        if (!warning) {
            await replyContainer(interaction, "Error", [`Warning case #${caseId} does not belong to ${targetUser.username}.`], "warn");
            return;
        }

        if (warning.liftedAt !== null) {
            await replyContainer(interaction, "Error", [`Warning case #${caseId} has already been lifted.`], "warn");
            return;
        }

        const container = await containerMaker(interaction, reason, "liftwarn");
        try {
            await targetUser.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            await moderateContainer(interaction.guild.id, "info", `I tried lifting a warning for ${targetUser.username}, but I could not DM them!`);
        }

        // Lift the warning.
        const result = await liftModerationCase(interaction, caseId);

        if (result.error) {
            await replyContainer(interaction, "Lift Warn", [`An error happened while trying to lift a warn for ${targetUser.username}.\nCase ID: #${caseId}\nError: ${result.desc}`], "warn");
        } else {
            await replyContainer(interaction, "Lift Warn", [`Lifted warning for user: ${targetUser.username}\nCase ID: #${caseId}.`], "info");
        }

        await moderateContainer(interaction.guild.id, "liftwarn", `${reason}.`, null, interaction.user, targetUser, caseId);
    },
};
