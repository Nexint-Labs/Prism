const { ContextMenuCommandBuilder } = require('discord.js');
const { searchGif } = require('#functions/discord/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { replyGifContainer, replyContainer } = require('#functions/discord/container/replyContainer');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { warning } = require('#config/discord/visual/botAssets');
const { klipyKey } = require('#config/discord/api/KlipyAPI');
const { loadAnim } = require('#functions/discord/helpers/load');
const { optOutChk } = require('#functions/discord/opt-out/optOut');
const { postAPI } = require('#functions/discord/api/fetch');
const { pluralValues } = require('#functions/discord/core/pluralValues');

module.exports = {
	cooldown: 5,
	data: new ContextMenuCommandBuilder()
        .setName('Poke!')
        .setType(3)
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
	async execute(interaction) {
        // defer Reply
        const embedMessage = await interaction.deferReply({
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

		// Opt-out check
		let optedOut = await optOutChk(interaction.user, interaction.targetMessage.author);

		// Add to analytics
		addCommandsUsed(interaction.user);

		// Search for gif
		const results = await searchGif("anime poke")

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

		// Description?
		let description = `One of you has opted out of data collection.`;
		if (!optedOut) {

            let findAction = await postAPI(
                '/actions/updateAction',
                {
                    userId: interaction.user.id,
                    actionId: interaction.targetMessage.author.id,
                    type: "poke",
                }
            );
            if (findAction.error) {
                findAction = {
                    error: true,
                    content: {
                        value: "(API Unavailable)"
                    }
                }
            }
			description = `${interaction.user.displayName} has poked ${interaction.targetMessage.author.displayName} ${findAction.content.value} time${pluralValues(findAction.content.value)}! ༼ つ ◕_◕ ༽つ\n-# Via Klipy API.`;
		}

		// Title?
		let title = `${interaction.user.displayName} pokes ${interaction.targetMessage.author.displayName}! ༼ つ ◕_◕ ༽つ`;

        // Send gif
        await replyGifContainer(
            interaction,
            title,
            description,
            results.url,
            results.shortURL
        )
		return;
	},
};