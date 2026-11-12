
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { client } = require('#bot');
const { checkPerms } = require('#functions/v2/moderation/helpers/permissionCheck');
const { replyContainer } = require("#functions/v2/discord/replyContainer");
const { containerMaker } = require('#functions/v2/moderation/helpers/containerMaker');
const { moderateContainer } = require('#functions/v2/moderation/moderateContainer');
const { createModerationCase } = require('#functions/v2/moderation/databaseQueries/addModCase');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Unban a user by their ID!')
		.addStringOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to unban.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('The unban reason.'))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const userId = interaction.options.getString("user", true);
		const targetMember = null;
		const targetUser = await client.users.fetch(userId).catch(() => ({ id: userId }));
		let reason;
		if (interaction.options.getString('reason') == null) {
			reason = "No reason given.";
		} else {
			reason = interaction.options.getString('reason');
		}

		const perms = await checkPerms(interaction, "ban", targetUser, targetMember);

		if (perms.error) {
			await replyContainer(interaction, "Unbans", [perms.desc], "ban");
			return;
		}

		const container = await containerMaker(interaction, reason, "unban");
		try {
			await targetUser.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2
			});
		} catch (error) {
			await moderateContainer(interaction.guild.id, "info", `I tried unbanning ${targetUser.username ?? targetUser.id}, but I could not DM them!`);
		}

		try {
			await interaction.guild.bans.remove(userId, reason);
		} catch (error) {
			await replyContainer(interaction, "Unbans", [`Failed to unban user ${userId}: ${error.message}`], "ban");
			return;
		}

		const result = await createModerationCase(interaction, "unban", targetUser.id, reason);

		if (result.error) {
			await replyContainer(interaction, "Unban", [`${targetUser.username ?? userId} was unbanned, but the moderation case could not be saved.\nReason: ${reason}.`], "ban");
		} else {
			await replyContainer(interaction, "Unbans", [`Unbanned user ${userId}\nReason: ${reason}.\nCase ID: #${result.case.caseId}`], "info");
		}

		await moderateContainer(interaction.guild.id, "unban", `${reason}.`, null, interaction.user, targetUser, result.error ? null : result.case.caseId);
	},
};
