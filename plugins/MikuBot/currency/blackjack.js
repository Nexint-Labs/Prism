const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { reserveWager, resolveWager } = require('#functions/v2/currency/transactions/wagers');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { followUpNotif } = require('#functions/v2/notify/checkNotifs');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { createContainer } = require('#functions/v2/discord/container');
const { handleInteractionError } = require('#functions/v2/helpers/handleInteractionError');
const { pluralValues } = require('#functions/v2/core/pluralValues');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription('Play blackjack. WIP.')
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount to bet.'))
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
				"Blackjack",
				["You are opted out. This command does not work."],
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
		let shortened = true;

		// balance check
		let balanceUser = await balanceCheck(guildMember);
		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			transfer = balanceUser.value;
		}
		if (transfer === null || isNaN(transfer)) {
			transfer = 0;
		}
		if (!Number.isFinite(transfer)) {
			await replyContainer(
				interaction,
				"Blackjack",
				["Please input a valid amount of money."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		if (transfer > balanceUser.value) {
			await replyContainer(
				interaction,
				"Blackjack",
				["You have insufficient funds to perform this action."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// check if trying to use less than 0 coins
		if (transfer <= 0) {
			await replyContainer(
				interaction,
				"Blackjack",
				["Please input a positive amount of money."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// Stake and payout settle atomically when the game finishes.

		// Commit the stake before dealing; abandoning the game never returns it.
		const wagerId = `blackjack:${interaction.id}`;
		try {
			const reservation = await reserveWager(interaction.user, transfer, wagerId);
			if (reservation.alreadyReserved) throw new Error('WAGER_ALREADY_RESERVED');
			balanceUser = reservation.wallet;
		} catch (error) {
			if (error.message.includes('INSUFFICIENT_FUNDS')) {
				await replyContainer(
					interaction,
					"Blackjack",
					["You have insufficient funds to perform this action."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return;
			}
			throw error;
		}

		// get card
		let deck = [];
		for (let i = 0; i < 13; i++) {
			for (let j = 0; j < 4; j++) {
				deck.push(i + 1);
			}
		}

		// define decks
		let dealerCards = [];
		let playerCards = [];

		// pick card function
		const pickCard = async function (cardDeck) {
			let cardPicked = Math.floor(Math.random() * deck.length);
			let card = deck.splice(cardPicked, 1)[0];
			cardDeck.push(card);
			return;
		}

		// calculate card function
		const calculateCard = async function (cardDeck) {
			let cardTotal = 0;
			let cards = [];
			let aceCount = 0;
			for (let i = 0; i < cardDeck.length; i++) {
				let card = cardDeck[i];
				if (card > 10) {
					cardTotal += 10;
					switch (card) {
						case 11:
							cards.push("J");
							break;
						case 12:
							cards.push("Q");
							break;
						case 13:
							cards.push("K");
							break;
						default:
							// this piece of code shouldnt run.
							// if this error happens, good luck. I wish you best of luck when debugging.
							throw new Error("Whoops!\nSomething seriously went wrong, and I can't pinpoint where it went.\nGood luck, have fun.\n\n- Nexint");
					}
				} else if (card < 2) {
					cardTotal += 11;
					aceCount += 1;
					cards.push("A");
				} else {
					cardTotal += card;
					cards.push(`${card}`);
				}
				if (cardTotal > 21 && aceCount > 0) {
					cardTotal -= 10;
					aceCount -= 1;
				}
			}
			// build return values
			let returnValue = {
				cards: cards,
				cardTotal: cardTotal
			}
			return returnValue;
		}

		// pick 2 cards for the dealer
		// note that a for loop is less efficient than just doing this twice, considering how blackjack works
		pickCard(dealerCards);
		pickCard(dealerCards);

		// calculate cards
		let player = await calculateCard(playerCards);
		let dealer = await calculateCard(dealerCards);

		// lost or not
		let lost = null;
		let transferred = false;
		let newCoinAmt;

		// hit till 17 or 5 cards exceeded
		while (dealer.cardTotal < 17 && dealer.cards.length < 5) {
			pickCard(dealerCards);
			dealer = await calculateCard(dealerCards);
		}

		// pick 2 cards for the player
		pickCard(playerCards);
		pickCard(playerCards);

		// build message
		const containerBuild = async function (stand) {

			// calculate cards again
			player = await calculateCard(playerCards);
			dealer = await calculateCard(dealerCards);

			// Prepare message
			let msg = "";
			let playercards = player.cards[0];
			for (let i = 1; i < player.cards.length; i++) {
				playercards += ", "
				playercards += player.cards[i];
			}
			let dealercards = dealer.cards[0];
			for (let i = 1; i < dealer.cards.length; i++) {
				dealercards += ", "
				dealercards += dealer.cards[i];
			}

			// set lost value
			if (player.cards.length >= 5 && player.cardTotal <= 21) {
				lost = false;
			} else if (player.cardTotal > 21) {
				if (dealer.cardTotal > 21) {
					lost = "tie";
				} else {
					lost = true;
				}
			} else if (player.cardTotal == 21) {
				if (dealer.cardTotal == 21) {
					lost = "tie";
				} else {
					lost = false;
				}
			} else if (stand) {
				if (dealer.cardTotal > 21) {
					lost = false;
				} else if (dealer.cardTotal > player.cardTotal) {
					lost = true;
				} else if (dealer.cardTotal == player.cardTotal) {
					lost = "tie";
				} else {
					lost = false;
				}
			}

			// define values for the text
			let level = 0;

			if (lost !== null && transferred === false) {
				const payout = lost === true ? 0 : lost === false ? transfer * 2 : transfer;
				const settlement = await resolveWager(interaction.user, transfer, payout, wagerId);
				balanceUser = settlement.wallet || await balanceCheck(interaction.user);
				newCoinAmt = await abbrevBalance(balanceUser.value);
				transferred = true;
				level = await expGain(guildMember);
			}

			// display the output text
			if (lost === true) {

				// lose text
				if (shortened) {
					msg = `You have lost ${(await abbrevBalance(transfer)).displayValue} coin${pluralValues(transfer)}.\n\nDealer: ${dealercards} (${dealer.cardTotal})\nPlayer: ${playercards} (${player.cardTotal})\n\nNew balance: ${newCoinAmt.displayValue}`;
				} else {
					msg = `You have lost ${transfer} coin${pluralValues(transfer)}.\n\nDealer: ${dealercards} (${dealer.cardTotal})\nPlayer: ${playercards} (${player.cardTotal})\n\nNew bank balance: ${newCoinAmt.value}`;
				}
			} else if (lost === false) {

				// win text
				if (shortened) {
					msg = `You have won ${(await abbrevBalance(transfer)).displayValue} coin${pluralValues(transfer)}.\n\nDealer: ${dealercards} (${dealer.cardTotal})\nPlayer: ${playercards} (${player.cardTotal})\n\nNew balance: ${newCoinAmt.displayValue}`;
				} else {
					msg = `You have won ${transfer} coin${pluralValues(transfer)}.\n\nDealer: ${dealercards} (${dealer.cardTotal})\nPlayer: ${playercards} (${player.cardTotal})\n\nNew bank balance: ${newCoinAmt.value}`;
				}
			} else if (lost === "tie") {

				// tied text
				if (shortened) {
					msg = `You have tied against the bot, and have not gained or lost anything.\n\nDealer: ${dealercards} (${dealer.cardTotal})\nPlayer: ${playercards} (${player.cardTotal})\n\nNew balance: ${newCoinAmt.displayValue}`;
				} else {
					msg = `You have tied against the bot, and have not gained or lost anything.\n\nDealer: ${dealercards} (${dealer.cardTotal})\nPlayer: ${playercards} (${player.cardTotal})\n\nNew balance: ${newCoinAmt.value}`;
				}
			} else {
				if (shortened) {
					msg = `You have bet ${(await abbrevBalance(transfer)).displayValue} coin${pluralValues(transfer)}.\n\nDealer: ${dealer.cards[0]}, ???\nPlayer: ${playercards} (${player.cardTotal})`;
				} else {
					msg = `You have bet ${transfer} coin${pluralValues(transfer)}.\n\nDealer: ${dealer.cards[0]}, ???\nPlayer: ${playercards} (${player.cardTotal})`;
				}
			}

			// misc level text
			if (level > 0) {
				msg += `\n\nYou gained an additional level! Your level is now ${level}`;
			}
			msg += "\n\n-# Legal disclaimer: **I do not endorse underage gambling. Use this command responsibly.**";

			// return embed
			return await createContainer(
				"Blackjack",
				[msg],
				"default",
			)
		}

		// row builder
		const rowBuild = async function () {

			// shortened numbers text
			let rows = new ActionRowBuilder();
			if (shortened) {
				rows.addComponents(
					new ButtonBuilder()
						.setCustomId("short")
						.setLabel('Short? ✔')
						.setStyle(ButtonStyle.Success)
				);
			} else {
				rows.addComponents(
					new ButtonBuilder()
						.setCustomId("short")
						.setLabel('Short? ❌')
						.setStyle(ButtonStyle.Danger)
				);
			}

			// hit / stand text
			if (lost === null) {
				rows.addComponents(
					new ButtonBuilder()
						.setCustomId("hit")
						.setLabel('Hit')
						.setStyle(ButtonStyle.Primary)
				);
				rows.addComponents(
					new ButtonBuilder()
						.setCustomId("stand")
						.setLabel('Stand')
						.setStyle(ButtonStyle.Primary)
				);

			}
			return rows;
		}

		// define userembed and row
		let container = await containerBuild(false);
		let row = await rowBuild();

		// analytics
		addCommandsUsed(interaction.user);

		// send reply
		await interaction.editReply({
			components: [container, row],
			flags: MessageFlags.IsComponentsV2
		});

		try {
			await followUpNotif(interaction);
		} catch (error) {
			console.error('[Blackjack] Notification failed:', error);
		}

		// balance refresh function
		const blackjackRefresh = async function () {
			const collectorFilter = i => i.user.id === interaction.user.id;
			while (true) {
				try {
					const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

					// Toggle short
					if (confirmation.customId == "short") {
						shortened = !shortened;
						container = await containerBuild(false);
						row = await rowBuild();
						await confirmation.update({
							components: [container, row],
							withResponse: true,
							withReply: true,
							flags: MessageFlags.IsComponentsV2
						})
						if (lost === null) {
							continue;
						};
						return;
					}

					// hit
					if (confirmation.customId == "hit") {
						pickCard(playerCards);
						container = await containerBuild(false);
						row = await rowBuild();
						await confirmation.update({
							components: [container, row],
							withResponse: true,
							withReply: true,
							flags: MessageFlags.IsComponentsV2
						})
						if (lost === null) {
							continue;
						};
						return;
					}

					// stand
					if (confirmation.customId == "stand") {
						container = await containerBuild(true);
						row = await rowBuild();
						await confirmation.update({
							components: [container, row],
							withResponse: true,
							withReply: true,
							flags: MessageFlags.IsComponentsV2
						})
						if (lost === null) {
							continue;
						};
						return;
					}
					return;
				} catch (error) {

					await handleInteractionError(interaction, response, error);
					return;
				}
			}
		}

		// start refreshing
		await blackjackRefresh();

		return;
	},
};