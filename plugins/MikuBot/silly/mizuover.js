const { SlashCommandBuilder } = require('discord.js');
const { botName } = require('#config/core/core');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('mizuover')
        .setDescription('It\'s mizuover.')
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
            "It's so mizuover. **1003.**",
            [
                "[Akiyama Mizuki](https://projectsekai.fandom.com/wiki/Akiyama_Mizuki) (暁山 瑞希) is a second year student at Kamiyama High School. They are the animator of the online music circle 25-ji, Nightcord de., going by the alias \"Amia\".",
                "-# This is a silly command."
            ],
            "default",
            null,
            {ephemeral: false}
        )
    },
};