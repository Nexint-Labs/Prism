const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { settleWager } = require('#functions/v2/currency/transactions/wagers');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { emoji } = require('#config/visual/emoji');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { warning } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { loadAnim } = require('#functions/v2/helpers/load');
const { createContainer } = require('#functions/v2/discord/container');
const { short } = require('#functions/v2/discord/menus/short');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { delay } = require('#functions/v2/helpers/delay');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('Pull a slot machine with coins (with REALLY terrible odds).')
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount to gamble.'))
		.addIntegerOption(option =>
			option
				.setName('zeros')
				.setDescription('The amount of zeroes behind.'))
		.addStringOption(option =>
			option
				.setName('all')
				.setDescription('Gamble all coins?')
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
				"Slots",
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

		// checks and slots values
		let slotValues = [":tangerine:", ":dollar:", ":fire:", ":heart:", ":gem:"];
		let multipliers = [3, 5, 3, 4, 10,];
		if (!Number.isFinite(addedCoins) || addedCoins <= 0) {
			await replyContainer(
				interaction,
				"Slots",
				["You can't gamble a non-positive amount."],
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
				"Slots",
				["You have insufficient funds to perform this action."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// Slots logic
		let slots = [];
		let slotLength = 3;
		for (let i = 0; i < slotLength; i++) {
			slots.push(Math.floor(Math.random() * slotValues.length));
		}
		let slotValue = slots[0];
		let reward = true;
		for (let i = 1; i < slotLength; i++) {
			if (slotValue != slots[i]) {
				if ((new Set(slots)).size !== slots.length) {
					multipliers[slotValue] = 1.5;
				} else {
					reward = false;
				}
			}
		}
		const netChange = reward
			? addedCoins * (multipliers[slotValue] - 1)
			: -addedCoins;

		let wager;
		try {
			wager = await settleWager(interaction.user, addedCoins, reward ? addedCoins * multipliers[slotValue] : 0);
		} catch (error) {
			if (error.message !== 'INSUFFICIENT_FUNDS') throw error;
			await replyContainer(
				interaction,
				"Slots",
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
			[`Rolling ${(await abbrevBalance(Math.abs(addedCoins))).displayValue} coins\n\n[${emoji.typeEmoji}][${emoji.typeEmoji}][${emoji.typeEmoji}]`],
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
				msg = `You decided to gamble ${addedCoins.displayValue} coins and got:\n\n`
				for (let i = 0; i < slotLength; i++) {
					msg += `[${slotValues[slots[i]]}]`
				}
				if (reward) {
					msg += `\n\nmaking ${multipliers[slotValue]}x your coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`
				} else {
					msg += `\n\nlosing all of your coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`
				}
			} else {
				msg = `You decided to gamble ${addedCoins.value} coins and got got:\n\n`
				for (let i = 0; i < slotLength; i++) {
					msg += `[${slotValues[slots[i]]}]`
				}
				if (reward) {
					msg += `\n\nmaking ${multipliers[slotValue]}x your coins.\nYour updated balance: ${newCoinAmt.value} coins.`
				} else {
					msg += `\n\nlosing all of your coins.\nYour updated balance: ${newCoinAmt.value} coins.`
				}
			}
			if (level > 0) {
				msg += `\n\nYou gained an additional level! Your level is now ${level}`;
			}
			msg += "\n\n-# Legal disclaimer: **I do not endorse underage gambling. Use this command responsibly.**";

			// return embed
			return await createContainer(
				"Slots",
				[msg],
				"default"
			)
		}

		// analytics
		await addCommandsUsed(interaction.user);

		// embed and short toggle
		await short(interaction, response, containerBuild);
	},
};