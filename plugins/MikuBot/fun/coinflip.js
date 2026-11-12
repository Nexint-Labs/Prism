const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { delay } = require('#functions/v2/helpers/delay');
const { loadAnim } = require('#functions/v2/helpers/load');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('cf')
		.setDescription('Coinflip, without the stakes.')
		.addStringOption(option =>
			option
				.setName('side')
				.setDescription('Heads or tails?')
				.setRequired(true)
				.addChoices(
					{ name: 'Heads', value: 'heads' },
					{ name: 'Tails', value: 'tails' },
				))
		.setIntegrationTypes([0, 1])
		.setContexts([0, 1, 2]),
	async execute(interaction) {
		// Defer reply
		const response = await interaction.deferReply({
			withResponse: true,
		});
	
        if (await checkBlacklist(interaction)) {
            return;
        }

		// rng
		let rng = Math.random();

		// coinflip logic
		let coinToss = "heads";
		if (rng < 0.5) {
			coinToss = "tails"
		}

		let answer = `You flipped a coin, and the coin shows ${coinToss}.`;

		await loadAnim(
			interaction,
			["Flipping coin..."],
			false
		)

		await delay(2000);

		// Add to analytics
		addCommandsUsed(interaction.user);

		// Send reply
		await replyContainer(
			interaction,
			"Coinflip",
			[answer],
			"default"
		)
	},
};