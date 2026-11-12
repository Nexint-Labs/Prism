const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { miku } = require('#config/visual/botAssets');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('miku-bot')
        .setDescription('Advertising our partner bot, MikuBot!')
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

        // Miku advertising message
        await replyContainer(
            interaction,
            "Miku",
            [
                "Install our partner bot, built with the same codebase, Miku!",
                "https://discord.com/oauth2/authorize?client_id=1459057307215331359"
            ],
            "default",
            miku,
            {
                ephemeral: true,
                checkNotif: false,
                advert: false
            }
        )
        return;
    }
};