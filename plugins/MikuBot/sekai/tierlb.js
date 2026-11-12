const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { sekaingToken } = require('#config/api/SekaingAPI');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { simpleMenu } = require('#functions/v2/discord/menus/pageHandler');
const { loadAnim } = require('#functions/v2/helpers/load');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('tierlb')
        .setDescription('Project Sekai Tierer Leaderboard.')
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
        
        await loadAnim(interaction, [
            "Loading Tiering Info...",
        ], true)

        // Add to analytics
        addCommandsUsed(interaction.user);

        // fetch
        const update = await fetch('https://seka.ing/api/leaderboard', {
            method: 'GET',
            headers: {
                'Authorization': `${sekaingToken}`,
                'Content-Type': `application/json`
            }
        });
        const event = await update.json();

        let leaderboard = []
        for(let i = 0; i < event.rankings.length; i++){
            leaderboard.push(`\`Rank ${event.rankings[i].rank}: ${event.rankings[i].name} (${(await abbrevBalance(event.rankings[i].score)).displayValue} points)\``);
        }

        await simpleMenu(
            interaction,
            response,
            `Event: ${event.event.name}`,
            leaderboard,
            ["No event results are available at the moment."],
            {
                compressed: true,
                watermark: "Powered by [seka.ing](https://seka.ing).",
                copyright: false,
            },
            null,
            `https://seka.ing/assets/${event.event.name_key}.png`
        )
        return;
    }
};