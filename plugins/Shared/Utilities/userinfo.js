const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { queryUser } = require('#functions/v2/analytics/usageData');
const { getUser } = require('#functions/v2/discord/shardInfo');
const { convNameToID } = require('#functions/v2/currency/accounts/balances');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { loadAnim } = require('#functions/v2/helpers/load');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Info about a specific user (defaults to you)!')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The person to gather info from.'))
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('The person to gather info from by name. Overridden by user.'))
		.addStringOption(option =>
			option
				.setName('id')
				.setDescription('The person to gather info from by ID. Overridden by user.'))
		.setIntegrationTypes([0, 1])
		.setContexts([0, 1, 2]),
	async execute(interaction) {
		// defer Reply
		const response = await interaction.deferReply({
			withResponse: true,
		});

		if (await checkBlacklist(interaction)) {
			return;
		}

		// Get current user
		let guildMember = interaction.options.getUser("user");
		if (guildMember === null) {
			let userID = interaction.options.getString("id");
			if (interaction.options.getString("name") !== null && userID === null) {
				userID = await convNameToID(interaction.options.getString("name"));
			}
			if (userID !== null) {
				guildMember = await getUser(userID);
			} else if (interaction.options.getString("name") === null) {
				guildMember = interaction.user;
			}
			if (guildMember === null) {

				await replyContainer(
					interaction,
					"User Info",
					[
						"This user does not exist."
					],
					"warn",
					warning,
					{
						advert: false,
					}
				)
				return
			}
		}

		await loadAnim(interaction, [
			"Loading User Info...",
		], true)

		// Query the user data
		let currentUser = await queryUser(guildMember);
		let registerDate;
		if (currentUser != null) {
			registerDate = Math.round(currentUser.registerDate / 1000);
		}
		let msg = "";

		// Output stats
		if (currentUser != null) {
			msg = msg + `**Personal Stats:**\n`;
			msg = msg + `Username: ${currentUser.name}\n`;
			msg = msg + `User ID: ${currentUser.userId}\n`;
			msg = msg + `Registry Date: <t:${registerDate}:f>\n`;
			msg = msg + `Commands run: ${currentUser.value}\n\n`;
		} else {
			await replyContainer(
				interaction,
				"User Info",
				[
					"There are no personal stats available.\n\nThis account is likely opted out of data tracking.",
				],
				"warn",
				warning,
				{
					advert: false,
					checkNotif: false,
				}
			)
			return;
		}


		await replyContainer(
			interaction,
			"User Info",
			[
				msg
			],
			"default",
			{
				desc: guildMember.displayName,
				url: guildMember.displayAvatarURL({ size: 256 })
			},
			{
				advert: false,
			}
		)
		return;
	},
};