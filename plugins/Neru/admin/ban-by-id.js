
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkPerms } = require('#functions/v2/moderation/helpers/permissionCheck');
const { replyContainer } = require("#functions/v2/discord/replyContainer");
const { containerMaker } = require('#functions/v2/moderation/helpers/containerMaker');
const { moderateContainer } = require('#functions/v2/moderation/moderateContainer');
const { createModerationCase } = require('#functions/v2/moderation/databaseQueries/addModCase');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ban-id')
		.setDescription('Ban a member!')
		.addStringOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to ban.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('The ban reason.'))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const userId = interaction.options.getString("user", true);
		const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
		const targetUser =
			targetMember?.user ??
			await interaction.client.users.fetch(userId).catch(() => ({ id: userId }));
		let reason;
		if (interaction.options.getString('reason') == null) {
			reason = "No reason given.";
		} else {
			reason = interaction.options.getString('reason');
		}

		const perms = await checkPerms(interaction, "ban", targetUser, targetMember);
		if (perms.error) {
			await replyContainer(interaction, "Bans", [perms.desc], "ban");
			return;
		}

		const container = await containerMaker(interaction, reason, "ban");
		try {
			await targetUser.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2
			});
		} catch (error) {
			await moderateContainer(interaction.guild.id, "info", `I tried banning ${targetUser.username ?? targetUser.id}, but I could not DM them!`);
		}

		try {
			await interaction.guild.members.ban(userId, { reason: reason });
		} catch (error) {
			await replyContainer(interaction, "Bans", [`Failed to ban user ${userId}: ${error.message}`], "ban");
			return;
		}

		const result = await createModerationCase(interaction, "ban", targetUser.id, reason);

		if (result.error) {
			await replyContainer(interaction, "Bans", [`${userId} was banned, but the moderation case could not be saved.\nError: ${result.desc}`], "ban");
		} else {
			await replyContainer(interaction, "Bans", [`Banned user ${userId}\nReason: ${reason}.\nCase ID: #${result.case.caseId}`], "ban");
		}

		await moderateContainer(interaction.guild.id, "ban", `${reason}.`, null, interaction.user, targetUser, result.error ? null : result.case.caseId);
	},
};
