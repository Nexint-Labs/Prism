const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { short } = require('#functions/discord/container/menus/short');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { createContainer } = require('#functions/discord/container/container');
const { pluralValues } = require('#functions/discord/core/pluralValues');
const { getUsername } = require('#functions/discord/core/getUsername');
const { postAPI, queryAPI } = require('#functions/discord/api/fetch');

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
			const result = await queryAPI("/currency/update/balance", {
				userId: interaction.user.id,
				name: getUsername(interaction.user),
			})

			if (result.error || bankResult.error) {
				await replyContainer(
					interaction,
					"API Error",
					["Could not deposit money."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return null;
			}
			transfer = Math.min(result.content.value, bankResult.content.maxValue - bankResult.content.value);
		}

		// check if trying to deposit less than 0 coins
		if (!Number.isFinite(transfer) || transfer <= 0) {
			await replyContainer(
				interaction,
				"Deposit",
				["You must deposit a positive amount of coins."],
				"warn",
				warning,
				{ advert: false }
			);
			return;
		}

		// perform action and save

		const result = await postAPI("/currency/update/bank/deposit", {
			userId: interaction.user.id,
			name: getUsername(interaction.user),
			amount: transfer
		})

		if (result.error) {
			if (result.status == 402) {
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
				return null;
			}
			if (result.status == 409) {
				await replyContainer(
					interaction,
					"Deposit",
					["Your bank is full."],
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
				["Could not deposit money."],
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

		transfer = abbrevBalance(transfer)

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `Deposited ${transfer.displayValue} coin${pluralValues(transfer.value)} into the bank.\nNew balance: ${(abbrevBalance(userBalance.value)).displayValue} coin${pluralValues(userBalance.value)}.\nNew bank balance: ${(abbrevBalance(bankBalance.value)).displayValue} coin${pluralValues(bankBalance.value)}.`;
			} else {
				msg = `Deposited ${transfer.value} coin${pluralValues(transfer.value)} into the bank.\nNew balance: ${(abbrevBalance(userBalance.value)).value} coin${pluralValues(userBalance.value)}.\nNew bank balance: ${(abbrevBalance(bankBalance.value)).value} coin${pluralValues(bankBalance.value)}.`;
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