const { SlashCommandBuilder } = require('discord.js');
const { expGain } = require('#functions/discord/currency/xp');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { short } = require('#functions/discord/container/menus/short');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { createContainer } = require('#functions/discord/container/container');
const { warning } = require('#config/discord/visual/botAssets');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { pluralValues, prefix } = require('#functions/discord/core/pluralValues');
const { postAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription(`Beg to gain ${prefix(0, true, false)} for the balance system.`),
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
				"Beg",
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

		const request = await postAPI("/currency/beg", {
			userId: guildMember.id,
			name: getUsername(guildMember)
		})
		if (request.error) {
			await replyContainer(
				interaction,
				"API Error",
				[`Could not beg for ${prefix(1, true, false)}.`],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return null;
		}
		const reward = request.content;
		let addedCoins = abbrevBalance(reward.addedBalance);
		let newCoinAmt = abbrevBalance(reward.user.value);

		let level = await expGain(guildMember);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `You decided to beg and got ${addedCoins.displayValue} ${prefix(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.displayValue} ${prefix(newCoinAmt.value)}.`;
				if (addedCoins.value == 0) {
					msg = `You decided to beg, but got ABSOLUTELY NOTHING BOZO.\n\nYour updated balance: ${newCoinAmt.displayValue} ${prefix(newCoinAmt.value)}.`
				} else if (reward.massiveTip) {
					msg = `You decided to beg and got a massive tip from a rich person, resulting in ${addedCoins.displayValue} ${prefix(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.displayValue} ${prefix(newCoinAmt.value)}.`
				}
			} else {
				msg = `You decided to beg and got ${addedCoins.value} ${prefix(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.value} ${prefix(newCoinAmt.value)}.`;
				if (addedCoins.value == 0) {
					msg = `You decided to beg, but got ABSOLUTELY NOTHING BOZO.\n\nYour updated balance: ${newCoinAmt.value} ${prefix(newCoinAmt.value)}.`
				} else if (reward.massiveTip) {
					msg = `You decided to beg and got a massive tip from a rich person, resulting in ${addedCoins.value} ${prefix(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.value} ${prefix(newCoinAmt.value)}.`
				}
			}
			if (level > 0) {
				msg += `\n\nYou gained an additional level! Your level is now ${level}`;
			}

			// return container
			return await createContainer(
				"Beg",
				[msg],
				"default"
			)
		}

		// analytics
		await addCommandsUsed(interaction.user);

		// container and short toggle
		await short(interaction, response, containerBuild);
	},
};