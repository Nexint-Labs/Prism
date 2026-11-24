const { SlashCommandBuilder } = require('discord.js');
const { postAPI, queryAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');
const { expGain } = require('#functions/discord/currency/xp');
const { short } = require('#functions/discord/container/menus/short');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { emoji } = require('#config/discord/visual/emoji');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { createContainer } = require('#functions/discord/container/container');
const { warning } = require('#config/discord/visual/botAssets');
const { loadAnim } = require('#functions/discord/helpers/load');
const delay = require('#functions/core/delay');
const { prefix } = require('#functions/discord/core/pluralValues');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('snakeeye')
		.setDescription('Snake eyes minigame - with TERRIBLE odds.')
		.addIntegerOption(option =>
			option
				.setName(`${prefix(0, false, false)}`)
				.setDescription(`The ${prefix(1)} amount to gamble.`))
		.addIntegerOption(option =>
			option
				.setName('zeros')
				.setDescription('The amount of zeroes behind.'))
		.addStringOption(option =>
			option
				.setName('all')
				.setDescription(`Gamble all ${prefix(0)}?`)
				.addChoices(
					{ name: 'True', value: 'true' },
				)),
	async execute(interaction) {
		const response = await interaction.deferReply({
			withResponse: true
		});

		if (await checkBlacklist(interaction)) {
			return;
		}

		if (await optOutChkSingle(interaction.user)) {
			await replyContainer(
				interaction,
				"Snake eyes",
				["You are already opted out. This command will not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// setup some variables
		let guildMember = interaction.user;

		// Calculate wager
		let addedCoins;

		if (interaction.options.getInteger("zeros") === null) {
			addedCoins = interaction.options.getInteger(prefix(0, false, false));
		} else {
			addedCoins = interaction.options.getInteger(prefix(0, false, false)) * Math.pow(10, interaction.options.getInteger("zeros"));
		}

		if (interaction.options.getString("all") === "true") {
			const result = await queryAPI("/currency/update/balance", {
				userId: guildMember.id,
				name: getUsername(guildMember)
			});

			if (result.error) {
				await replyContainer(
					interaction,
					"API Error",
					[`Could not retrieve your ${prefix(0)}.`],
					"warn",
					warning,
					{
						advert: false
					}
				);
				return;
			}

			addedCoins = result.content.value;
		}

		if (addedCoins === null || isNaN(addedCoins)) {
			addedCoins = 0;
		}

		if (!Number.isFinite(addedCoins) || addedCoins <= 0) {
			await replyContainer(
				interaction,
				"Snake eyes",
				[`You cannot gamble a non-positive amount of ${prefix(0)}.`],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		const stake = addedCoins;

		// Snake eyes logic
		let rng = Math.floor(Math.random() * 6) + 1;
		let rng2 = Math.floor(Math.random() * 6) + 1;

		if (rng < 2 && rng2 < 2) {
			addedCoins *= 24;
		} else if (rng != rng2) {
			addedCoins *= -1;
		}

		// Settle wager through NexAPI
		const result = await postAPI("/currency/update/balance", {
			userId: guildMember.id,
			name: getUsername(guildMember),
			amount: addedCoins,
			required: stake
		});

		if (result.error) {
			if (result.status == 402) {
				await replyContainer(
					interaction,
					"Snake eyes",
					[`You have insufficient ${prefix(0)} to perform this action.`],
					"warn",
					warning,
					{
						advert: false
					}
				);
				return;
			}

			await replyContainer(
				interaction,
				"API Error",
				["Could not play snake eyes."],
				"warn",
				warning,
				{
					advert: false
				}
			);
			return;
		}

		let balanceUser = result.content;

		// artificial delay to make it look interesting
		await loadAnim(
			interaction,
			[`Rolling the dice...\n[${emoji.typeEmoji}] [${emoji.typeEmoji}]`],
			false
		)

		await delay(3000);
		addedCoins = abbrevBalance(addedCoins);
		let newCoinAmt = abbrevBalance(balanceUser.value);
		let level = await expGain(guildMember);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `You rolled [${rng}] [${rng2}], and made back ${addedCoins.displayValue} ${prefix(addedCoins.value)}.\nYour updated balance: ${newCoinAmt.displayValue} ${prefix(newCoinAmt.value)}.`
				if (addedCoins.value < 0) {
					msg = `You rolled [${rng}] [${rng2}], and lost ${(abbrevBalance(addedCoins.value * -1)).displayValue} ${prefix(addedCoins.value)}.\nYour updated balance: ${newCoinAmt.displayValue} ${prefix(newCoinAmt.value)}.`
				}
			} else {
				msg = `You rolled [${rng}] [${rng2}], and made back ${addedCoins.value} ${prefix(addedCoins.value)}.\nYour updated balance: ${newCoinAmt.value} ${prefix(newCoinAmt.value)}.`
				if (addedCoins.value < 0) {
					msg = `You rolled [${rng}] [${rng2}], and lost ${Math.abs(addedCoins.value)} ${prefix(addedCoins.value)}.\nYour updated balance: ${newCoinAmt.value} ${prefix(newCoinAmt.value)}.`
				}
			}
			if (level > 0) {
				msg += `\n\nYou gained an additional level! Your level is now ${level}`;
			}
			msg += "\n\n-# Legal disclaimer: **I do not endorse underage gambling. Use this command responsibly.**";

			// return embed
			return await createContainer("Snake eyes", [msg]);
		}

		// analytics
		await addCommandsUsed(interaction.user);

		// embed and short toggle
		await short(interaction, response, containerBuild);
	},
};