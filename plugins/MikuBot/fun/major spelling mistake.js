const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { replyGifContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('major')
        .setDescription('Major spelling mistake.')
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

        // Add to analytics
        addCommandsUsed(interaction.user);

        // Send reply
        await replyGifContainer(
            interaction,
            "Major Spelling Mistake",
            "Very major spelling mistake 💀",
            "https://tenor.com/view/major-spelling-mistake-gif-1745161421153268178",
            "https://media.tenor.com/GDgPEPeOcdIAAAAd/major-spelling-mistake.gif"
        )
    },
};