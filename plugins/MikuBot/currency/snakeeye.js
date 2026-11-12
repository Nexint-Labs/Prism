const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { settleWager } = require('#functions/v2/currency/transactions/wagers');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { short } = require('#functions/v2/discord/menus/short');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { emoji } = require('#config/visual/emoji');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { createContainer } = require('#functions/v2/discord/container');
const { delay } = require('#functions/v2/helpers/delay');
const { warning } = require('#config/visual/botAssets');
const { loadAnim } = require('#functions/v2/helpers/load');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('snakeeye')
		.setDescription('Snake eyes minigame - with TERRIBLE odds.')
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount.'))
		.addIntegerOption(option =>
			option
				.setName('zeros')
				.setDescription('The amount of zeroes behind.'))
		.addStringOption(option =>
			option
				.setName('all')
				.setDescription('Bet all coins?')
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

		let balanceUser = await balanceCheck(guildMember);
		let addedCoins;
		if (interaction.options.getInteger("zeros") === null) {
			addedCoins = interaction.options.getInteger("coins");
		} else {
			addedCoins = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			addedCoins = balanceUser.value;
		}
		if (addedCoins === null || isNaN(addedCoins)) {
			addedCoins = 0;
		}
		if (!Number.isFinite(addedCoins) || addedCoins <= 0) {
			await replyContainer(
				interaction,
				"Snake eyes",
				["You cannot gamble a non-positive amount of coins."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		if (addedCoins > balanceUser.value) {
			await replyContainer(
				interaction,
				"Snake eyes",
				["You have insufficient funds to perform this action."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		const stake = addedCoins;

		// snakeeyes logic
		let rng = Math.floor(Math.random() * 6) + 1;
		let rng2 = Math.floor(Math.random() * 6) + 1;
		if (rng < 2 && rng2 < 2) {
			addedCoins *= 24;
		} else if (rng != rng2) {
			addedCoins *= -1;
		}
		let wager;
		try {
			wager = await settleWager(interaction.user, stake, stake + addedCoins);
		} catch (error) {
			if (error.message !== 'INSUFFICIENT_FUNDS') throw error;
			await replyContainer(
				interaction,
				"Snake eyes",
				["You have insufficient funds to perform this action."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		balanceUser = wager.wallet;

		// artificial delay to make it look interesting
		await loadAnim(
			interaction,
			[`Rolling the dice...\n[${emoji.typeEmoji}] [${emoji.typeEmoji}]`],
			false
		)

		await delay(3000);
		addedCoins = await abbrevBalance(addedCoins);
		let newCoinAmt = await abbrevBalance(balanceUser.value);
		let level = await expGain(guildMember);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `You rolled [${rng}] [${rng2}], and made back ${addedCoins.displayValue} coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`
				if (addedCoins.value < 0) {
					msg = `You rolled [${rng}] [${rng2}], and lost ${(await abbrevBalance(addedCoins.value * -1)).displayValue} coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`
				}
			} else {
				msg = `You rolled [${rng}] [${rng2}], and made back ${addedCoins.value} coins.\nYour updated balance: ${newCoinAmt.value} coins.`
				if (addedCoins.value < 0) {
					msg = `You rolled [${rng}] [${rng2}], and lost ${Math.abs(addedCoins.value)} coins.\nYour updated balance: ${newCoinAmt.value} coins.`
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