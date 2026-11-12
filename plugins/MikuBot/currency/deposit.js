const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { bankCheck } = require('#functions/v2/currency/accounts/banks');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { short } = require('#functions/v2/discord/menus/short');
const { transferBank } = require('#functions/v2/currency/transactions/transfers');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { createContainer } = require('#functions/v2/discord/container');
const { pluralValues } = require('#functions/v2/core/pluralValues');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('deposit')
		.setDescription('Deposit a specific amount into the bank.')
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount to transfer.'))
		.addIntegerOption(option =>
			option
				.setName('zeros')
				.setDescription('The amount of zeroes behind.'))
		.addStringOption(option =>
			option
				.setName('all')
				.setDescription('Deposit all coins?')
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
				"Deposit",
				["You are opted out. This command will not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// get the balance and bank values
		let userBalance = await balanceCheck(interaction.user);
		let bankBalance = await bankCheck(interaction.user);
		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			transfer = userBalance.value;
		}
		if (transfer === null || isNaN(transfer)) {
			transfer = 0;
		}

		// check if coins is enough
		if (transfer > userBalance.value) {
			await replyContainer(
				interaction,
				"Deposit",
				["You have insufficient funds to perform this action."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// make sure coins dont overflow
		if (transfer > bankBalance.maxValue - bankBalance.value) {
			transfer = bankBalance.maxValue - bankBalance.value;
		}

		// check if trying to deposit less than 0 coins
		if (transfer < 0) {
			
			await replyContainer(
				interaction,
				"Deposit",
				["You can't deposit less than 0 coins."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// perform action and save
		const {
			userBalance: newWallet,
			bankBalance: newBank,
			transferred
		} = await transferBank(interaction.user, transfer, 'deposit');

		userBalance = newWallet;
		bankBalance = newBank;
		transfer = await abbrevBalance(transferred)

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `Deposited ${transfer.displayValue} coin${pluralValues(transfer.value)} into the bank.\nNew balance: ${(await abbrevBalance(userBalance.value)).displayValue} coin${pluralValues(userBalance.value)}.\nNew bank balance: ${(await abbrevBalance(bankBalance.value)).displayValue} coin${pluralValues(bankBalance.value)}.`;
			} else {
				msg = `Deposited ${transfer.value} coin${pluralValues(transfer.value)} into the bank.\nNew balance: ${(await abbrevBalance(userBalance.value)).value} coin${pluralValues(userBalance.value)}.\nNew bank balance: ${(await abbrevBalance(bankBalance.value)).value} coin${pluralValues(bankBalance.value)}.`;
			}

			// return embed
			return await createContainer(
				"Deposit",
				[msg],
				"default"
			);
		}

		// analytics
		await addCommandsUsed(interaction.user);

		// embed and short toggle
		await short(interaction, response, containerBuild);
	},
};