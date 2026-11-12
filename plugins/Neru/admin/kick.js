
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkPerms } = require('#functions/v2/moderation/helpers/permissionCheck');
const { replyContainer } = require("#functions/v2/discord/replyContainer");
const { containerMaker } = require('#functions/v2/moderation/helpers/containerMaker');
const { moderateContainer } = require('#functions/v2/moderation/moderateContainer');
const { createModerationCase } = require('#functions/v2/moderation/databaseQueries/addModCase');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to kick.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('The kick reason.'))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
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

		const perms = await checkPerms(interaction, "kick", targetUser, targetMember);
		if (perms.error) {
			await replyContainer(interaction, "Kicks", [perms.desc], "kick");
			return;
		}

		const container = await containerMaker(interaction, reason, "kick");
		try {
			await targetUser.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2
			});
		} catch (error) {
			await moderateContainer(interaction.guild.id, "info", `I tried kicking ${targetUser.username}, but I could not DM them!`);
		}

		try {
			await targetMember.kick(reason);
		} catch (error) {
			await replyContainer(interaction, "Kicks", [`Failed to kick user ${targetUser.username}: ${error.message}`], "kick");
			return;
		}

		const result = await createModerationCase(interaction, "kick", targetUser.id, reason);

		if (result.error) {
			await replyContainer(interaction, "Kicks", [`${targetUser.username} was kicked, but the moderation case could not be saved.\nError: ${result.desc}`], "kick");
		} else {
			await replyContainer(interaction, "Kicks", [`Kicked member ${targetUser.username}\nReason: ${reason}.\nCase ID: #${result.case.caseId}`], "kick");
		}

		await moderateContainer(interaction.guild.id, "kick", `${reason}.`, null, interaction.user, targetUser, result.error ? null : result.case.caseId);
	},
};
