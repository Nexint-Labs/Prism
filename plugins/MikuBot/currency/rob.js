const { SlashCommandBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { miscCheck } = require('#functions/v2/currency/progression/records');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { request } = require('#functions/v2/currency/apiRead');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { emoji } = require('#config/visual/emoji');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { dmNotify } = require('#functions/v2/notify/dmNotify');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { delay } = require('#functions/v2/helpers/delay');

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('rob')
		.setDescription('Steal someone\'s coins. Costs 1000 coins to attempt to steal.')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person to steal from.')),
	async execute(interaction) {

		// defer
		const response = await interaction.deferReply({
			withResponse: true,
		});

		if (await checkBlacklist(interaction)) {
			return;
		}

		// make sure you can actually steal
		let guildMember = interaction.options.getUser("user");
		if (guildMember.id == interaction.user.id) {
			await replyContainer(
				interaction,
				"Rob",
				["You can't steal from yourself."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		if (guildMember.bot) {
			await replyContainer(
				interaction,
				"Rob",
				["You can't steal from bots."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// Opt out check
		if (await optOutChkSingle(guildMember)) {
			await replyContainer(
				interaction,
				"Rob",
				["This person is opted out. This command will not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		if (await optOutChkSingle(interaction.user)) {
			await replyContainer(
				interaction,
				"Rob",
				["You are opted out. This command will not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// set variables up
		let balanceUser = await balanceCheck(interaction.user);
		let balanceRobbed = await balanceCheck(guildMember);
		let miscRobbed = await miscCheck(guildMember);

		// more checks to make sure you can actually rob them
		if ((await miscCheck(interaction.user)).robbable == false) {
			await replyContainer(
				interaction,
				"Rob",
				["You have opted out from being robbed. This command does not work for you."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		if (miscRobbed.robbable == false) {
			await replyContainer(
				interaction,
				"Rob",
				["This user has opted out from being robbed."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		if (balanceRobbed.value == 0) {
			await replyContainer(
				interaction,
				"Rob",
				["You can't steal from anyone who has 0 coins."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		// rob protection
		if (Math.floor(Date.now() / 1000) - miscRobbed.lastRobbed < 86400) {
			let nextSteal = Number(miscRobbed.lastRobbed) + 86400;
			await replyContainer(
				interaction,
				"Rob",
				[`This user has already been stolen from in the past day. You may rob them again <t:${nextSteal}:R>.`],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// start robbing

		await replyContainer(
			interaction,
			"Rob",
			[`Robbing ${guildMember.displayName} ${emoji.loadEmoji}`],
			"default",
			null,
			{
				checkNotif: false
			}
		)
		await delay(3000);

		const robResult = await request('attemptRobbery', {
			robberId: interaction.user.id, robberName: interaction.user.username,
			victimId: guildMember.id, victimName: guildMember.username
		});
		if (robResult.status === 'UNAVAILABLE') {
			await replyContainer(
				interaction,
				"Rob",
				['The robbery could not be completed. The target or your balance changed during the attempt.'],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}
		const addedCoins = robResult.addedCoins;
		balanceUser = { value: robResult.robberBalance };
		balanceRobbed = { value: robResult.victimBalance };

		let msg;
		if (robResult.status === 'FAILED') {
			msg = `You tried stealing from ${guildMember.displayName}, but failed. They will be notified of your attempt.`;
		} else if (robResult.status === 'SUCCESS') {
			msg = `You stole from ${guildMember.displayName} and made ${(await abbrevBalance(addedCoins)).displayValue} coins.\nYour new balance: ${(await abbrevBalance(balanceUser.value)).displayValue} coins.`;
		} else if (robResult.status === 'JACKPOT') {
			msg = `You stole ALL OF ${guildMember.displayName}'S COINS LOL and made ${(await abbrevBalance(addedCoins)).displayValue} coins.\nYour new balance: ${(await abbrevBalance(balanceUser.value)).displayValue} coins.`;
		} else {
			throw new Error(`Unexpected robbery status: ${robResult.status}`);
		}

		// level gain
		let level = await expGain(interaction.user);
		if (level > 0) {
			msg += `\n\nYou gained an additional level! Your level is now ${level}`;
		}
		msg += "\n-# Legal disclaimer: **I do not endorse actual crimes.**";

		// analytics tracking
		try {
			await addCommandsUsed(interaction.user);
		} catch (error) {
			console.error('[Rob] Analytics failed:', error);
		}

		// send message

		await replyContainer(
			interaction,
			"Rob",
			[msg],
			"default"
		)
		let coins = await abbrevBalance(addedCoins);
		try {
			const messageUrl = response.resource.message.url;
			let result;
			if (robResult.status === 'FAILED') {
				result = await dmNotify(guildMember, [`${interaction.user.displayName} tried robbing you in the channel ${messageUrl}, but failed.\nYour new balance: ${(await abbrevBalance(balanceRobbed.value)).displayValue} coins.`], null, null);
			} else {
				result = await dmNotify(guildMember, [`${interaction.user.displayName} has robbed you of ${coins.displayValue} coins in the channel ${messageUrl}.\nYour new balance: ${(await abbrevBalance(balanceRobbed.value)).displayValue} coins.`], null, null);
			}
			if (result !== 0 && result?.rawError?.message != "Cannot send messages to this user") console.log(result);
		} catch (error) {
			console.error('[Rob] DM failed:', error);
		}
	},
};