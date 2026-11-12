const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { settleWager } = require('#functions/v2/currency/transactions/wagers');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { short } = require('#functions/v2/discord/menus/short');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { warning, loading } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer')
const { createContainer } = require('#functions/v2/discord/container');
const { emoji } = require('#config/visual/emoji');
const { pluralValues } = require('#functions/v2/core/pluralValues');
const { delay } = require('#functions/v2/helpers/delay');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Coinflip coins (with REALLY terrible odds).')
		.addStringOption(option =>
			option
				.setName('side')
				.setDescription('Heads or tails?')
				.setRequired(true)
				.addChoices(
					{ name: 'Heads', value: 'heads' },
					{ name: 'Tails', value: 'tails' },
				))
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
				.setDescription('Coinflip all coins?')
				.addChoices(
					{ name: 'True', value: 'true' },
				)),
	async execute(interaction) {

		// defer reply
		const response = await interaction.deferReply({
			withResponse: true,
		});

		if (await checkBlacklist(interaction)) {
			return;
		}

		if (await optOutChkSingle(interaction.user)) {
			await replyContainer(
				interaction,
				"Coinflip",
				["You are opted out. This command will not work."],
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

		// find the balance
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

		// checks and rng value
		let rng = Math.random();
		if (!Number.isFinite(addedCoins) || addedCoins <= 0) {
			await replyContainer(
				interaction,
				"Coinflip",
				["Coin value must be positive."],
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
				"Coinflip",
				["You have insufficient funds to perform this action."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// coinflip logic
		let coinToss = interaction.options.getString("side");
		if (rng < 0.5) {
			switch (interaction.options.getString("side")) {
				case "heads":
					coinToss = "tails";
					break;
				default:
					coinToss = "heads";
			}
			addedCoins = addedCoins * -1
		}

		let stake = Math.abs(addedCoins);
		let payout = addedCoins > 0 ? stake * 2 : 0;
		let wager;
		try {
			wager = await settleWager(interaction.user, stake, payout);
		} catch (error) {
			if (error.message !== 'INSUFFICIENT_FUNDS') throw error;
			await replyContainer(
				interaction,
				"Coinflip",
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
		await replyContainer(
			interaction,
			"Coinflip",
			[`Coinflipping ${(await abbrevBalance(Math.abs(addedCoins))).displayValue} coin${pluralValues(Math.abs(addedCoins))} [${emoji.loadEmoji}]`],
			"default",
			loading,
			{
				checkNotif: false,
				advert: false
			}
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
				msg = `You decided to coinflip ${addedCoins.displayValue} coin${pluralValues(addedCoins.displayValue)} and landed ${coinToss}, making your coins back.\nYour updated balance: ${newCoinAmt.displayValue} coin${pluralValues(newCoinAmt.value)}.`
				if (addedCoins.value < 0) {
					msg = `You decided to coinflip ${(await abbrevBalance(addedCoins.value * -1)).displayValue} coin${pluralValues(addedCoins.displayValue)} and landed ${coinToss}, losing all of your coin${pluralValues(newCoinAmt.value)}.\nYour updated balance: ${newCoinAmt.displayValue} coin${pluralValues(newCoinAmt.value)}.`
				}
			} else {
				msg = `You decided to coinflip ${addedCoins.value} coin${pluralValues(addedCoins.displayValue)} and landed ${coinToss}, making your coins back.\nYour updated balance: ${newCoinAmt.value} coin${pluralValues(newCoinAmt.value)}.`
				if (addedCoins.value < 0) {
					msg = `You decided to coinflip ${Math.abs(addedCoins.value)} coin${pluralValues(addedCoins.displayValue)} and landed ${coinToss}, losing all of your coins.\nYour updated balance: ${newCoinAmt.value} coin${pluralValues(newCoinAmt.value)}.`
				}
			}
			if (level > 0) {
				msg += `\n\nYou gained an additional level! Your level is now ${level}`;
			}
			msg += "\n\n-# Legal disclaimer: **I do not endorse underage gambling. Use this command responsibly.**";

			// return embed
			return await createContainer(
				"Coinflip",
				[msg],
				"default",
			)
		}

		// analytics
		await addCommandsUsed(interaction.user);

		// embed and short toggle
		await short(interaction, response, containerBuild);
	},
};