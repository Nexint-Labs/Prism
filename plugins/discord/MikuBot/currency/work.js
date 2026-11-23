const { SlashCommandBuilder } = require('discord.js');
const { expGain } = require('#functions/discord/currency/xp');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { short } = require('#functions/discord/container/menus/short');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { createContainer } = require('#functions/discord/container/container');
const { postAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('work')
		.setDescription('Work to gain money. Cooldown of 30 seconds.'),
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
				"Work",
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
		const result = await postAPI("/currency/work/job", {
			userId: guildMember.id,
			name: getUsername(guildMember)
		})
		if (result.error) {
			let msg;
			if (result.status == 410 && result.title === "Job Expired") {
				msg = 'You have been fired. Please apply for a new job with /apply!';
			} else if (result.status == 404) {
				msg = 'You do not have a job. Please apply for one with /apply!';
			} else if (result.status == 410) {
				msg = 'You are already opted out. This command will not work.';
			} else {
				await replyContainer(
					interaction,
					"API Error",
					["Could not work for money."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return;
			}
			await replyContainer(
				interaction,
				"Work",
				[msg],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		
		const workResult = result.content;

		const addedCoins = abbrevBalance(workResult.addedBalance);
		const raise = abbrevBalance(workResult.raise);

		const level = await expGain(interaction.user);
		const newCoinAmt = abbrevBalance(workResult.user.value);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg;
			if (shortened) {
				msg = `You decided to work at your job and got ${addedCoins.displayValue} coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`;
				if (raise.value > 0) {
					msg += `\n-# You got a raise from working so hard! Your salary has increased by ${raise.displayValue} coins.`
				}
			} else {
				msg = `You decided to work at your job and got ${addedCoins.value} coins.\nYour updated balance: ${newCoinAmt.value} coins.`;
				if (raise.value > 0) {
					msg += `\n-# You got a raise from working so hard! Your salary has increased by ${raise.value} coins.`
				}
			}
			if (level > 0) {
				msg += `\n-# You gained an additional level! Your level is now ${level}`;
			}

			// return embed
			return await createContainer(
				"Work",
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