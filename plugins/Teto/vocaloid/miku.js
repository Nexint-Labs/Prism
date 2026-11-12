const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { searchGif } = require('#functions/v2/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { replyGifContainer, replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { klipyKey } = require('#config/api/KlipyAPI');
const { loadAnim } = require('#functions/v2/helpers/load');

// Name
// Configured at the top lol
const capsName = "Miku";
const fullName = "Hatsune Miku"
const name = capsName.toLowerCase();
const pluralName = `a ${capsName}`;
const searchTerm = `${fullName} vocaloid`;

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName(name)
        .setDescription(`Pulls a gif of ${capsName}!`)
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {
        // defer Reply
        await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        // Check for klipy key
        if (klipyKey == "") {
            await replyContainer(
                interaction,
                "Gif Config Failure",
                [
                    "The bot owner didn't set up an API key for Klipy."
                ],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        await loadAnim(interaction, [
            "Finding Gif...",
        ], true)

        // Add to analytics
        addCommandsUsed(interaction.user);

        // Level Gain (50/50)
        if (interaction.guild != null && Math.random() > 0.5) {
            await expGain(interaction.user);
        }

        // Search for Gif
        const results = await searchGif(searchTerm)

        // Handle null
        if (results == null) {
            await replyContainer(
                interaction,
                "Gif Failure",
                [
                    "Something went wrong when trying to search for a gif!"
                ],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return
        }

        // Configure the gif response
        let title = `Found ${pluralName} Gif!`;

        // Send gif
        await replyGifContainer(
            interaction,
            title,
            null,
            results.url,
            results.shortURL
        )
        return;
    }
};