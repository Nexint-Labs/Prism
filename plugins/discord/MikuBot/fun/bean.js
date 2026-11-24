const { SlashCommandBuilder } = require('discord.js');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');

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
        await addCommandsUsed(interaction.user);

        // Send reply
        await replyContainer(
            interaction,
            "Bean",
            ["bean."],
            "default"
        )
    },
};