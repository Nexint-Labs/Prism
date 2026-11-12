const { SlashCommandBuilder } = require('discord.js');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('bean')
        .setDescription('bean.')
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
            "Bean",
            ["bean."],
            "default"
        )
    },
};