const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { workCheck } = require('#functions/v2/currency/progression/records');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { updateMulti } = require('#functions/v2/currency/accounts/multipliers');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { short } = require('#functions/v2/discord/menus/short');
const { request, member } = require('#functions/v2/currency/apiRead');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { createContainer } = require('#functions/v2/discord/container');

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

		// load balance numbers
		await updateMulti(guildMember);
		let balanceUser = await balanceCheck(guildMember);
		let workUser = await workCheck(guildMember);

		// check if a person has a job
		if (workUser.jobId == -1) {
			await replyContainer(
				interaction,
				"Work",
				["You do not have a job. Please apply for one with /apply!"],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		const workResult = await request('performWork', member(guildMember));
		if (workResult.status !== 'OK') {
			let msg = 'You do not have a job. Please apply for one with /apply!';
			if (workResult.status === 'FIRED') msg = 'You have been fired. Please apply for a new job with /apply!';
			if (workResult.status === 'COOLDOWN') msg = 'You must wait 30 seconds before working again.';
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
		let addedCoins = workResult.addedCoins;
		balanceUser = { value: workResult.balance };
		workUser = workResult.work;
		let raise = workResult.raise;

		let level = await expGain(interaction.user);
		addedCoins = await abbrevBalance(addedCoins);
		let newCoinAmt = await abbrevBalance(balanceUser.value);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg;
			if (shortened) {
				msg = `You decided to work at your job and got ${addedCoins.displayValue} coins.\nYour updated balance: ${newCoinAmt.displayValue} coins.`;
				if (raise > 0) {
					msg += `\n-# You got a raise from working so hard! Your salary has increased by ${(await abbrevBalance(raise)).displayValue} coins.`
				}
			} else {
				msg = `You decided to work at your job and got ${addedCoins.value} coins.\nYour updated balance: ${newCoinAmt.value} coins.`;
				if (raise > 0) {
					msg += `\n-# You got a raise from working so hard! Your salary has increased by ${(await abbrevBalance(raise)).value} coins.`
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