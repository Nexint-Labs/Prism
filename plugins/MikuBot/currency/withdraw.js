const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { bankCheck } = require('#functions/v2/currency/accounts/banks');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { short } = require('#functions/v2/discord/menus/short');
const { transferBank } = require('#functions/v2/currency/transactions/transfers');
const { warning } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { createContainer } = require('#functions/v2/discord/container');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('withdraw')
		.setDescription('Withdraw a specific amount from the bank.')
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
				.setDescription('Withdraw all coins?')
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
				"Withdraw",
				["You are already opted out. This command will not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		let userBalance = await balanceCheck(interaction.user);
		let bankBalance = await bankCheck(interaction.user);
		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			transfer = bankBalance.value;
		}
		if (transfer === null || isNaN(transfer)) {
			transfer = 0;
		}
		// check if coins is enough
		if (transfer > bankBalance.value) {
			await replyContainer(
				interaction,
				"Withdraw",
				["You have insufficient funds to perform this action."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// check if trying to withdraw less than 0 coins
		if (transfer < 0) {
			await replyContainer(
				interaction,
				"Withdraw",
				["You can't withdraw less than 0 coins."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// do the actual action
		const result = await transferBank(
			interaction.user,
			transfer,
			'withdraw'
		);

		userBalance = result.userBalance;
		bankBalance = result.bankBalance;
		transfer = await abbrevBalance(transfer);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `Withdrew ${transfer.displayValue} coins from the bank.\nNew balance: ${(await abbrevBalance(userBalance.value)).displayValue} coins.\nNew bank balance: ${(await abbrevBalance(bankBalance.value)).displayValue} coins.`;
			} else {
				msg = `Withdrew ${transfer.value} coins from the bank.\nNew balance: ${(await abbrevBalance(userBalance.value)).value} coins.\nNew bank balance: ${(await abbrevBalance(bankBalance.value)).value} coins.`;
			}

			// return embed
			return await createContainer(
				"Withdraw",
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