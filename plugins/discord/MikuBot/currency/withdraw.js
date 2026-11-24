const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { short } = require('#functions/discord/container/menus/short');
const { warning } = require('#config/discord/visual/botAssets');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { createContainer } = require('#functions/discord/container/container');
const { postAPI, queryAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');
const { pluralValues, prefix } = require('#functions/discord/core/pluralValues');

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

		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			const bankResult = await queryAPI("/currency/update/bank", {
				userId: interaction.user.id,
				name: getUsername(interaction.user),
			})

			if (bankResult.error) {
				await replyContainer(
					interaction,
					"API Error",
					["Could not withdraw money."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return null;
			}
			transfer = bankResult.content.value;
		}

		// check if trying to withdraw less than 0 coins
		if (!Number.isFinite(transfer) || transfer <= 0) {
			await replyContainer(
				interaction,
				"Withdraw",
				["You must withdraw a positive amount of coins."],
				"warn",
				warning,
				{ advert: false }
			);
			return;
		}

		// perform action and save

		const result = await postAPI("/currency/update/bank/withdraw", {
			userId: interaction.user.id,
			name: getUsername(interaction.user),
			amount: transfer
		})

		if (result.error) {
			if (result.status == 402) {
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
				return null;
			}
			await replyContainer(
				interaction,
				"API Error",
				["Could not withdraw money."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return null;
		}

		let userBalance = result.content.user;
		let bankBalance = result.content.bank;
		transfer = abbrevBalance(transfer);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `Withdrew ${transfer.displayValue} ${prefix(transfer.value)} from the bank.\nNew balance: ${(abbrevBalance(userBalance.value)).displayValue} ${prefix(userBalance.value)}.\nNew bank balance: ${(abbrevBalance(bankBalance.value)).displayValue} ${prefix(bankBalance.value)}.`;
			} else {
				msg = `Withdrew ${transfer.value} ${prefix(transfer.value)} from the bank.\nNew balance: ${(abbrevBalance(userBalance.value)).value} ${prefix(userBalance.value)}.\nNew bank balance: ${(abbrevBalance(bankBalance.value)).value} ${prefix(bankBalance.value)}.`;
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