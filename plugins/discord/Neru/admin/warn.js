
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkPerms } = require('#functions/discord/moderation/helpers/permissionCheck');
const { replyContainer } = require("#functions/discord/container/replyContainer");
const { containerMaker } = require('#functions/discord/moderation/helpers/containerMaker');
const { moderateContainer } = require('#functions/discord/moderation/moderateContainer');
const { createModerationCase } = require('#functions/discord/moderation/databaseQueries/addModCase');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a member!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to warn.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('The warn reason.'))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
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

		const perms = await checkPerms(interaction, "warn", targetUser, targetMember);
		if (perms.error) {
			await replyContainer(interaction, "Warns", [perms.desc], "warn");
			return;
		}

		const container = await containerMaker(interaction, reason, "warn");
		try {
			await targetUser.send({
				components: [container],
				flags: MessageFlags.IsComponentsDISCORD
			});
		} catch (error) {
			await moderateContainer(interaction.guild.id, "info", `I tried warning ${targetUser.username}, but I could not DM them!`);
		}

		const result = await createModerationCase(interaction, "warn", targetUser.id, reason);

		if (result.error) {
			await replyContainer(interaction, "Warns", [`An error happened while trying to warn ${targetUser.username}.\nError: ${result.desc}`], "warn");
			return;
		}

		await replyContainer(interaction, "Warns", [`Warned ${targetUser.displayName}\nReason: ${reason}.\nCase ID: #${result.case.caseId}`], "warn");
		await moderateContainer(interaction.guild.id, "warn", `${reason}.`, null, interaction.user, targetUser, result.case.caseId);
	},
};
