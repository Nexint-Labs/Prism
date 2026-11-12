const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('tsundere')
        .setDescription('I\'m not a tsundere...')
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
        await replyContainer(
            interaction,
            "D- D- Don't get the wrong idea! >~< ",
            [`I'm not a dere, a tsun-tsundere \nI have a Jell-O heart, I'm not that mean! \nI'm not blushing, I was just rushing and forgot the sunscreen!`],
            "default"
        )
    },
};