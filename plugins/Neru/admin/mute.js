
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkPerms } = require("#functions/v2/moderation/helpers/permissionCheck");
const { replyContainer } = require("#functions/v2/discord/replyContainer");
const { containerMaker } = require("#functions/v2/moderation/helpers/containerMaker");
const { moderateContainer } = require("#functions/v2/moderation/moderateContainer");
const { createModerationCase } = require("#functions/v2/moderation/databaseQueries/addModCase");
const { calcDuration } = require('#functions/v2/helpers/calcDuration');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mute (timeout) a member!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to mute.'))
		.addStringOption(option =>
			option
				.setName("duration")
				.setRequired(true)
				.setDescription("Duration (e.g. 30s, 15m, 2h, 7d, max 28d)")
				.setMaxLength(20)
		)
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('The mute reason.'))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		const targetUser = interaction.options.getUser("user", true);
		const durationInput = interaction.options.getString("duration", true);
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
			await replyContainer(interaction, "Mute", [perms.desc], "mute");
			return;
		}

		// Validate the duration.
		const duration = calcDuration(durationInput);

		if (duration === null) {
			await replyContainer(interaction, "Mute", ["Invalid duration. Examples: 30s, 15m, 2h, 7d. Maximum: 28 days."], "mute");
			return;
		}

		// Notify the user.
		const container = await containerMaker(interaction, `${reason}\nDuration: ${durationInput}`, "mute");
		try {
			await targetUser.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2
			});
		} catch (error) {
			await moderateContainer(interaction.guild.id, "info", `I tried muting ${targetUser.username}, but I could not DM them!`);
		}

		// Apply the timeout.
		try {
			await targetMember.timeout(duration * 1000, reason);
		} catch (error) {
			await replyContainer(interaction, "Mute", [`Failed to mute ${targetUser.username}: ${error.message}`], "mute");
			return;
		}

		// Create the moderation case.
		const result = await createModerationCase(interaction, "mute", targetUser.id, `${reason} | Duration: ${durationInput}`);

		if (result.error) {
			await replyContainer(interaction, "Mute", [`${targetUser.username} was timed out for ${durationInput}, but the moderation case could not be saved.\nReason: ${reason}.`], "mute");
		} else {
			await replyContainer(interaction, "Mute", [`Muted ${targetUser.username} for ${durationInput}.\nReason: ${reason}.\nCase ID: #${result.case.caseId}`], "mute");
		}

		// Confirm the action.
		await moderateContainer(interaction.guildId, "mute", `${reason}\nDuration: ${durationInput}`, null, interaction.user, targetUser, result.error ? null : result.case.caseId);
	},
};
