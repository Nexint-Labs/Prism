const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { simpleMenu } = require('#functions/v2/discord/menus/pageHandler');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('testing-array')
        .setDescription(`Testing Simple arrays!`)
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {

        // defer replies
        const response = await interaction.deferReply({
            withResponse: true,
        });

        // Credits for MikuBot
        let msgArray = [];
        for (let i = 0; i < 50; i++) {
            msgArray.push(`Element ${i}`)
        }
        simpleMenu(
            interaction,
            response,
            "Title",
            msgArray,
            ["There is no result lol"]
        )
        return;
    }
};