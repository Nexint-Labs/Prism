const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { botName, source } = require('#config/core/core');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('source')
        .setDescription(`Source code of ${botName}bot.`)
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {
        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true,
            flags: MessageFlags.Ephemeral,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        // Support message
        await replyContainer(
            interaction,
            "Server Info",
            [
                `${botName}Bot's source code is available here! ${source}`
            ],
            "default",
            null,
            {
                advert: false,
                ephemeral: true,
            }
        )
        return;
    }
};