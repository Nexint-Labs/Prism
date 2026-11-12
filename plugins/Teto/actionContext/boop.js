const { ContextMenuCommandBuilder } = require('discord.js');
const { searchGif } = require('#functions/v2/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { replyGifContainer, replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { klipyKey } = require('#config/api/KlipyAPI');
const { loadAnim } = require('#functions/v2/helpers/load');
const { optOutChk } = require('#functions/v2/opt-out/optOut');
const { postAPI } = require('#functions/v2/api/fetch');
const { pluralValues } = require('#functions/v2/core/pluralValues');

module.exports = {
	cooldown: 5,
	data: new ContextMenuCommandBuilder()
        .setName('Boop!')
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
                    type: "boop",
                }
            );
            if(findAction.error){
                findAction = {
                    error: true,
                    value: "(API Unavailable)"
                }
            }
			description = `${interaction.user.displayName} has booped ${interaction.targetMessage.author.displayName} ${findAction.value} time${pluralValues(findAction.value)}! ༼ つ ◕_◕ ༽つ\n`;
		}

		// Title?
		let title = `${interaction.user.displayName} boops ${interaction.targetMessage.author.displayName}! ༼ つ ◕_◕ ༽つ`;

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