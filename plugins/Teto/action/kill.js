const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { searchGif } = require('#functions/v2/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { replyGifContainer, replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { klipyKey } = require('#config/api/KlipyAPI');
const { loadAnim } = require('#functions/v2/helpers/load');
const { dmGifNotify } = require('#functions/v2/notify/dmNotify');
const { optOutChk } = require('#functions/v2/opt-out/optOut');
const { postAPI } = require('#functions/v2/api/fetch');
const { pluralValues } = require('#functions/v2/core/pluralValues');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('kill')
		.setDescription('Death command - not serious')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person to unalive.'))
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
		const results = await searchGif("anime murder kill")

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
                    type: "kill",
                }
            );
            if(findAction.error){
                findAction = {
                    error: true,
                    value: "(API Unavailable)"
                }
            }
			description = `${interaction.user.displayName} has killed ${interaction.options.getUser("user").displayName} ${findAction.value} time${pluralValues(findAction.value)}...`;
		}

		// Title?
		let title = `${interaction.user.displayName} kills ${interaction.options.getUser("user").displayName}...`;

        // Send gif
        await replyGifContainer(
            interaction,
            title,
            description,
            results.url,
            results.shortURL
        )

		// DM Notify
		let notifdesc = `${interaction.user.displayName} kills you in the channel ${embedMessage.resource.message.url}!`;
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