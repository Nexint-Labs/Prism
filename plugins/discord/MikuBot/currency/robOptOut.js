const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { warning } = require('#config/discord/visual/botAssets');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { dmNotify } = require('#functions/discord/notify/dmNotify');
const { postAPI } = require('#functions/discord/api/fetch');
const { log } = require('#functions/core/log.mjs');

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

		const robbable = interaction.options.getString('opt-out') === 'false';

		const result = await postAPI('/currency/rob/toggle', {
			userId: interaction.user.id,
			name: interaction.user.username,
			robbable
		});

		if (result.error) {
			await replyContainer(
				interaction,
				'API Error',
				['Could not update your robbery settings.'],
				'warn',
				warning,
				{
					advert: false
				}
			);
			return;
		}

		// opt out?
		let msg = 'You have opted out of being robbed.\n-# Note that you cannot rob others.';
		if (robbable) {
			msg = 'You have opted into being robbed.\n-# You can now be robbed.';
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
		let dmResult = await dmNotify(guildMember, [msg]);
		if (dmResult !== 0 && dmResult?.rawError?.message != "Cannot send messages to this user") {
			log.error(dmResult);
		}
	},
};