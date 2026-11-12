const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { request, member } = require('#functions/v2/currency/apiRead');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { warning } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { dmNotify } = require('#functions/v2/notify/dmNotify');

module.exports = {
	cooldown: 86400,
	data: new SlashCommandBuilder()
		.setName('rob-toggle')
		.setDescription('Toggle opt in or opt out of being robbed.')
		.addStringOption(option =>
			option
				.setName('opt-out')
				.setDescription('Do you want to opt out of robbery?')
				.setRequired(true)
				.addChoices(
					{ name: 'Yes', value: 'true' },
					{ name: 'No', value: 'false' },
				)),
	async execute(interaction) {
		// defer reply
		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		if (await checkBlacklist(interaction)) {
			return;
		}
		if (await optOutChkSingle(interaction.user)) {
			await replyContainer(
				interaction,
				"Rob Toggle",
				["You are already opted out. This command does not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// member related stuff
		let guildMember = interaction.user;


		// opt out?
		let msg;
		switch (interaction.options.getString("opt-out")) {
			case "true":
				await request('setRobbable', { ...member(guildMember), robbable: false });
				msg = 'You have opted out of being robbed.\n-# Note that you cannot rob others.'
				break;
			case "false":
				await request('setRobbable', { ...member(guildMember), robbable: true });
				msg = 'You have opted into being robbed.\n-# You can now be robbed.'
				break;
		}


		// analytics
		addCommandsUsed(interaction.user);

		// send reply

		await replyContainer(
			interaction,
			"Rob Toggle",
			[msg],
			"default",
		)
		let result = await dmNotify(guildMember, [msg]);
		if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
			console.log(result);
		}
	},
};