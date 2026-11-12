const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { delay } = require('#functions/v2/helpers/delay');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { loadAnim } = require('#functions/v2/helpers/load');
const { getAnswer } = require('#config/fun/8ball');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Just a standard 8ball.')
		.addStringOption(option =>
			option
				.setName('question')
				.setRequired(true)
				.setDescription('Prompt to ask the 8ball.'))
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

		const answer = getAnswer();

		// Add to analytics
		addCommandsUsed(interaction.user);

		// Artificial Embed
		await loadAnim(
			interaction,
			[":8ball: is thinking..."],
			false
		)

		await delay(2000);

		await replyContainer(
			interaction,
			":8ball: 8ball",
			["You asked Miku: `" + interaction.options.getString("question") + "`.","You got: `" + answer + "`",],
			"default"
		)
	},
};