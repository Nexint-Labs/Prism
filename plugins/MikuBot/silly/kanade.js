const { SlashCommandBuilder } = require('discord.js');
const { botName } = require('#config/core/core');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('kana')
		.setDescription('Kanade from Project Sekai.')
		.setIntegrationTypes([0,1])
		.setContexts([0,1,2]),
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
            "Kana - Kanade",
            [
                "[Yoisaki Kanade](https://projectsekai.fandom.com/wiki/Yoisaki_Kanade) (宵よい崎さき 奏 ) is a third-year student taking online classes. She is the leader and composer of the online music circle 25-ji, Nightcord de., going by the alias \"K\".",
                "-# This is a silly command."
            ],
            "default",
            null,
            {ephemeral: false}
        )
	},
};