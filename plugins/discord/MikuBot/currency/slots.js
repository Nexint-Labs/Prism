const { SlashCommandBuilder } = require('discord.js');
const { postAPI, queryAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');
const { expGain } = require('#functions/discord/currency/xp');
const { emoji } = require('#config/discord/visual/emoji');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { warning } = require('#config/discord/visual/botAssets');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { loadAnim } = require('#functions/discord/helpers/load');
const { createContainer } = require('#functions/discord/container/container');
const { short } = require('#functions/discord/container/menus/short');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const delay = require('#functions/core/delay');
const { prefix } = require('#functions/discord/core/pluralValues');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription(`Pull a slot machine and gamble ${prefix(0)} (with REALLY terrible odds).`)
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

		// Calculate wager
		let addedCoins;

		if (interaction.options.getInteger("zeros") === null) {
			addedCoins = interaction.options.getInteger("coins");
		} else {
			addedCoins = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
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
					["Could not retrieve your balance."],
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

		// Slots logic
		let slots = [];
		let slotLength = 3;
		for (let i = 0; i < slotLength; i++) {
			slots.push(Math.floor(Math.random() * slotValues.length));
		}
		let slotValue = slots[0];
		let reward = false;
		let multiplier = 0;

		if (slots[0] === slots[1] && slots[1] === slots[2]) {
			reward = true;
			multiplier = multipliers[slotValue];
		} else if (new Set(slots).size === 2) {
			reward = true;
			multiplier = 1.5;
		}

		let netChange;

		if (reward) {
			netChange = addedCoins * (multiplier - 1);
		} else {
			netChange = -addedCoins;
		}

		const result = await postAPI("/currency/update/balance", {
			userId: guildMember.id,
			name: getUsername(guildMember),
			amount: netChange,
			required: addedCoins
		});

		if (result.error) {
			if (result.status == 402) {
				await replyContainer(
					interaction,
					"Slots",
					["You have insufficient funds to perform this action."],
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
				["Could not play slots."],
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
			[`Rolling ${(abbrevBalance(Math.abs(addedCoins))).displayValue} coins\n\n[${emoji.typeEmoji}][${emoji.typeEmoji}][${emoji.typeEmoji}]`],
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
				msg = `You decided to gamble ${addedCoins.displayValue} coins and got:\n\n`
				for (let i = 0; i < slotLength; i++) {
					msg += `[${slotValues[slots[i]]}]`
				}
				if (reward) {
					msg += `\n\nmaking ${multiplier}x your coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`
				} else {
					msg += `\n\nlosing all of your wagered coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`
				}
			} else {
				msg = `You decided to gamble ${addedCoins.value} coins and got:\n\n`
				for (let i = 0; i < slotLength; i++) {
					msg += `[${slotValues[slots[i]]}]`
				}
				if (reward) {
					msg += `\n\nmaking ${multiplier}x your coins.\nYour updated balance: ${newCoinAmt.value} coins.`
				} else {
					msg += `\n\nlosing all of your wagered coins.\nYour updated balance: ${newCoinAmt.value} coins.`
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