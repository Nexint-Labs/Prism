const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { replyGifContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('minori')
        .setDescription('Minori spelling mistake.')
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
            "Minori Spelling Mistake",
            "Small spelling mistake 💀",
            "https://tenor.com/view/minori-hanasato-minori-pjsk-more-more-jump-project-sekai-pjsk-gif-10970315925687936087",
            "https://media.tenor.com/mD5kNhBwpFcAAAAC/minori-hanasato-minori-pjsk.gif"
        )
    },
};