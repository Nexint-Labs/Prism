const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck, convNameToID } = require('#functions/v2/currency/apiRead');
const { bankCheck } = require('#functions/v2/currency/apiRead');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { short } = require('#functions/v2/discord/menus/short');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { createContainer } = require('#functions/v2/discord/container');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { getUser } = require('#functions/v2/discord/shardInfo');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('bal')
		.setDescription('Views balance of anyone. (Version 2)')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The person\'s balance to check. Defaults to yourself.'))
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('The person\'s balance to check by name. Overridden by user.'))
		.addStringOption(option =>
			option
				.setName('id')
				.setDescription('The person\'s balance to check. Overridden by user.')),
	async execute(interaction) {
		// defer reply
		const response = await interaction.deferReply({
			withResponse: true,
		});

		if (await checkBlacklist(interaction)) {
			return;
		}

		// Get current user
		let guildMember = interaction.options.getUser("user");
		if (guildMember === null) {
			let userID = interaction.options.getString("id");
			if (interaction.options.getString("name") !== null && userID === null) {
				userID = await convNameToID(interaction.options.getString("name"));
			}
			if (userID != null) {
				guildMember = await getUser(userID);
			} else if (interaction.options.getString("name") === null) {
				guildMember = interaction.user;
			}
			if (guildMember == null) {
				await replyContainer(
					interaction,
					"Balance",
					["This target does not exist."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return
			}
		}

		// check for opt out

		if (await optOutChkSingle(guildMember)) {
			await replyContainer(
				interaction,
				"Balance",
				["The target is already opted out. This command will not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// build message
		const containerBuild = async function (shortened) {

			// prep balance
			const [wallet, bank] = await Promise.all([
				balanceCheck(guildMember),
				bankCheck(guildMember)
			]);

			const balanceUser = await abbrevBalance(wallet.value);
			const bankBalanceUser = await abbrevBalance(bank.value);
			const bankMax = await abbrevBalance(bank.maxValue);

			// formulate msg
			let msg = "";

			// Balance
			const displayName =
				guildMember.displayName ??
				guildMember.globalName ??
				guildMember.username ??
				guildMember.id;
			if (guildMember.id == interaction.user.id) {
				msg += "Your balance: "
			} else {
				msg += `${displayName}'s balance: `;
			}
			if (shortened) {
				msg += `${balanceUser.displayValue} coins.\n`
			} else {
				msg += `${balanceUser.value} coins.\n`
			}

			// Bank Balance
			if (guildMember.id == interaction.user.id) {
				msg += "Your bank balance: "
			} else {
				msg += `${displayName}'s bank balance: `;
			}
			if (shortened) {
				msg += `${bankBalanceUser.displayValue} / ${bankMax.displayValue} coins.\n`
			} else {
				msg += `${bankBalanceUser.value} / ${bankMax.value} coins.\n`
			}

			// return embed
			return await createContainer("Balance", [msg]);
		}

		// analytics
		await addCommandsUsed(interaction.user);

		// embed and short toggle
		await short(interaction, response, containerBuild, true);
	},
};