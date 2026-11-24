const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { loadAnim } = require('#functions/discord/helpers/load');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const delay = require('#functions/core/delay');

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
		await addCommandsUsed(interaction.user);

		// Send reply
		await replyContainer(
			interaction,
			"Coinflip",
			[answer],
			"default"
		)
	},
};