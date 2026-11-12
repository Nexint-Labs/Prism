
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkPerms } = require("#functions/v2/moderation/helpers/permissionCheck");
const { replyContainer } = require("#functions/v2/discord/replyContainer");
const { containerMaker } = require("#functions/v2/moderation/helpers/containerMaker");
const { moderateContainer } = require("#functions/v2/moderation/moderateContainer");
const { createModerationCase } = require("#functions/v2/moderation/databaseQueries/addModCase");

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Remove a member's timeout.")
        .addUserOption(option =>
            option
                .setName('user')
                .setRequired(true)
                .setDescription('The user to unmute.'))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The mute reason.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const targetUser = interaction.options.getUser("user", true);
        const targetMember =
            interaction.options.getMember("user") ??
            await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        let reason;
        if (interaction.options.getString('reason') == null) {
            reason = "No reason given.";
        } else {
            reason = interaction.options.getString('reason');
        }

        const perms = await checkPerms(interaction, "mute", targetUser, targetMember);
        if (perms.error) {
            await replyContainer(interaction, "Unmute", [perms.desc], "warn");
            return;
        }
        if (!targetMember.isCommunicationDisabled()) {
            await replyContainer(interaction, "Unmute", ["This member is not currently timed out."], "warn");
            return;
        }

        // Notify the user.
        const container = await containerMaker(interaction, reason, "unmute");
        try {
            await targetUser.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            await moderateContainer(interaction.guild.id, "info", `I tried unmuting ${targetUser.username}, but I could not DM them!`);
        }

        // Apply the timeout.
        try {
            await targetMember.timeout(null, reason);
        } catch (error) {
            await replyContainer(interaction, "Unmute", [`Failed to unmute ${targetUser.username}: ${error.message}`], "warn");
            return;
        }

        // Create the moderation case.
        const result = await createModerationCase(interaction, "unmute", targetUser.id, reason);

        if (result.error) {
            await replyContainer(interaction, "Unmute", [`${targetUser.username} was unmuted, but the moderation case could not be saved\nReason: ${reason}.`], "warn");
        } else {
            await replyContainer(interaction, "Unmute", [`Unmuted ${targetUser.username}.\nReason: ${reason}.\nCase ID: #${result.case.caseId}`], "info");
        }

        await moderateContainer(interaction.guildId, "unmute", `${reason}`, null, interaction.user, targetUser, result.error ? null : result.case.caseId);
    },
};
