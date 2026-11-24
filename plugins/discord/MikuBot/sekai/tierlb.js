const { SlashCommandBuilder } = require('discord.js');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { sekaingToken } = require('#config/discord/api/SekaingAPI');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { simpleMenu } = require('#functions/discord/container/menus/pageHandler');
const { loadAnim } = require('#functions/discord/helpers/load');

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
        await addCommandsUsed(interaction.user);

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