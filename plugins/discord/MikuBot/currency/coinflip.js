const { SlashCommandBuilder } = require('discord.js');
const { expGain } = require('#functions/discord/currency/xp');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { short } = require('#functions/discord/container/menus/short');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { warning, loading } = require('#config/discord/visual/botAssets');
const { replyContainer } = require('#functions/discord/container/replyContainer')
const { createContainer } = require('#functions/discord/container/container');
const { emoji } = require('#config/discord/visual/emoji');
const { pluralValues } = require('#functions/discord/core/pluralValues');
const delay = require('#functions/core/delay');
const { postAPI, queryAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Coinflip a weighted coin (with REALLY terrible odds).')
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
					["Could not wager money."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return;
			}
			addedCoins = result.content.value;
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

		// coinflip logic
		let coinToss = interaction.options.getString("side");
		if (rng < 0.51) { // weighting (intentional) (real) (totally legit)
			switch (interaction.options.getString("side")) {
				case "heads":
					coinToss = "tails";
					break;
				default:
					coinToss = "heads";
			}
			addedCoins = addedCoins * -1
		}
		const result = await postAPI("/currency/update/balance", {
			userId: guildMember.id,
			name: getUsername(guildMember),
			amount: addedCoins,
			required: Math.abs(addedCoins)
		});

		if (result.error) {
			if (result.status == 402) {
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
				return null;
			}
			await replyContainer(
				interaction,
				"API Error",
				["Could not coinflip."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		let balanceUser = result.content;

		// artificial delay to make it look interesting
		await replyContainer(
			interaction,
			"Coinflip",
			[`Coinflipping ${(abbrevBalance(Math.abs(addedCoins))).displayValue} coin${pluralValues(Math.abs(addedCoins))} [${emoji.loadEmoji}]`],
			"default",
			loading,
			{
				checkNotif: false,
				advert: false
			}
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
				msg = `You decided to coinflip ${addedCoins.displayValue} coin${pluralValues(addedCoins.value)} and landed ${coinToss}, doubling your coins.\nYour updated balance: ${newCoinAmt.value} coin${pluralValues(newCoinAmt.value)}.`
				if (addedCoins.value < 0) {
					msg = `You decided to coinflip ${(await abbrevBalance(addedCoins.value * -1)).displayValue} coin${pluralValues(addedCoins.displayValue)} and landed ${coinToss}, losing all of your wagered coin${pluralValues(newCoinAmt.value)}.\nYour updated balance: ${newCoinAmt.displayValue} coin${pluralValues(newCoinAmt.value)}.`
				}
			} else {
				msg = `You decided to coinflip ${addedCoins.value} coin${pluralValues(addedCoins.value)} and landed ${coinToss}, doubling your coins.\nYour updated balance: ${newCoinAmt.value} coin${pluralValues(newCoinAmt.value)}.`
				if (addedCoins.value < 0) {
					msg = `You decided to coinflip ${Math.abs(addedCoins.value)} coin${pluralValues(addedCoins.value)} and landed ${coinToss}, losing all of your wagered coins.\nYour updated balance: ${newCoinAmt.value} coin${pluralValues(newCoinAmt.value)}.`
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