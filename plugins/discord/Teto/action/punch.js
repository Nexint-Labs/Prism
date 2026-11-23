const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { searchGif } = require('#functions/discord/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { expGain } = require('#functions/discord/currency/xp');
const { replyGifContainer, replyContainer } = require('#functions/discord/container/replyContainer');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { warning } = require('#config/discord/visual/botAssets');
const { klipyKey } = require('#config/discord/api/KlipyAPI');
const { loadAnim } = require('#functions/discord/helpers/load');
const { dmGifNotify } = require('#functions/discord/notify/dmNotify');
const { optOutChk } = require('#functions/discord/opt-out/optOut');
const { postAPI } = require('#functions/discord/api/fetch');
const { pluralValues } = require('#functions/discord/core/pluralValues');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('punch')
		.setDescription('Punches someone!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person to punch.'))
		.addBooleanOption(option =>
			option
				.setName('notify')
				.setDescription('Whether or not to notify the person. Defaults to false.'))
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
        let optedOut = await optOutChk(interaction.user, interaction.options.getUser("user"));

        // Add to analytics
        addCommandsUsed(interaction.user);

        // Level Gain (50/50)
        if (interaction.guild != null && Math.random() > 0.5) {
            await expGain(interaction.user);
        }

        // Search for gif
		const results = await searchGif("anime punch")

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

		// What should the description be?
		let description = `One of you has opted out of data collection.`;
		if (!optedOut) {

            let findAction = await postAPI(
                '/actions/updateAction',
                {
                    userId: interaction.user.id,
                    actionId: interaction.options.getUser("user").id,
                    type: "punch",
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
			description = `${interaction.user.displayName} has punched ${interaction.options.getUser("user").displayName} ${findAction.content.value} time${pluralValues(findAction.content.value)}...`;
		}

		// Title?
		let title = `${interaction.user.displayName} punches ${interaction.options.getUser("user").displayName} D:`;

        // Send gif
        await replyGifContainer(
            interaction,
            title,
            description,
            results.url,
            results.shortURL
        )

		// DM Notify
		let notifdesc = `${interaction.user.displayName} punched you in the channel ${embedMessage.resource.message.url}!`;
        let notify = interaction.options.getBoolean("notify");
        if (notify == null) {
            notify = false;
        }
        if (notify && interaction.contextType !== InteractionContextType.PrivateChannel) {
            await dmGifNotify(interaction.options.getUser("user"), notifdesc, results.url, results.shortURL);
        }
		return;
	},
};