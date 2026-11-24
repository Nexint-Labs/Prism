const { SlashCommandBuilder } = require('discord.js');
const { expGain } = require('#functions/discord/currency/xp');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { warning } = require('#config/discord/visual/botAssets');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { emoji } = require('#config/discord/visual/emoji');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { dmNotify } = require('#functions/discord/notify/dmNotify');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const delay = require('#functions/core/delay');
const { postAPI } = require('#functions/discord/api/fetch');
const { prefix } = require('#functions/discord/core/pluralValues');
const { log } = require('#functions/core/log.mjs');

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('rob')
		.setDescription(`Steal someone\'s ${prefix(0)}. Costs 1000 ${prefix(0)} to attempt to steal.`)
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

		const result = await postAPI('/currency/transfer/rob', {
			robberId: interaction.user.id,
			robberName: interaction.user.username,
			victimId: guildMember.id,
			victimName: guildMember.username
		});

		if (result.error) {
			if (result.status == 402) {
				await replyContainer(
					interaction,
					"Rob",
					["You have insufficient funds to perform this action."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return null;
			}
			if (result.status === 409 && result.content?.nextRobbery) {
				await replyContainer(
					interaction,
					"Rob",
					[`This user has already been robbed in the past day. You may rob them again <t:${result.content.nextRobbery}:R>.`],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return;
			}
			if (result.status == 404) {
				await replyContainer(
					interaction,
					"Rob",
					[`The victim has 0 ${prefix(0)}.`, "Why are you beating a dead bush anyways?"],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return null;
			}
			if (result.status == 403) {
				await replyContainer(
					interaction,
					"Rob",
					["Someone has opted out of robbing."],
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
				["Could not rob user."],
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

		const robResult = result.content;
		const addedCoins = robResult.addedCoins;

		const robberBalance = robResult.robberBalance;
		const victimBalance = robResult.victimBalance;

		let msg;
		if (robResult.outcome === 'FAILED') {
			msg = `You tried stealing from ${guildMember.displayName}, but failed. They will be notified of your attempt.`;
		} else if (robResult.outcome === 'SUCCESS') {
			msg = `You stole from ${guildMember.displayName} and made ${(abbrevBalance(addedCoins)).displayValue} ${prefix(addedCoins)}.\nYour new balance: ${(abbrevBalance(robberBalance)).displayValue} ${prefix(robberBalance)}.`;
		} else if (robResult.outcome === 'JACKPOT') {
			msg = `You stole ALL OF ${guildMember.displayName}'S ${prefix(addedCoins)} LOL and made ${(abbrevBalance(addedCoins)).displayValue} ${prefix(addedCoins)}.\nYour new balance: ${(abbrevBalance(robberBalance)).displayValue} ${prefix(robberBalance)}.`;
		} else {
			throw new Error(`Unexpected robbery outcome: ${robResult.outcome}`);
		}

		// level gain
		let level = await expGain(interaction.user);
		if (level > 0) {
			msg += `\n\nYou gained an additional level! Your level is now ${level}`;
		}
		msg += "\n-# Legal disclaimer: **I do not endorse actual crimes.**";

		// analytics tracking
		await addCommandsUsed(interaction.user);

		// send message

		await replyContainer(
			interaction,
			"Rob",
			[msg],
			"default"
		)
		let coins = abbrevBalance(addedCoins);
		try {
			const messageUrl = response.resource.message.url;
			let result;
			if (robResult.outcome === 'FAILED') {
				result = await dmNotify(guildMember, [`${interaction.user.displayName} tried robbing you in the channel ${messageUrl}, but failed.\nYour new balance: ${(abbrevBalance(victimBalance)).displayValue} ${prefix(victimBalance)}.`], null, null);
			} else {
				result = await dmNotify(guildMember, [`${interaction.user.displayName} has robbed you of ${coins.displayValue} ${prefix(coins.value)} in the channel ${messageUrl}.\nYour new balance: ${(abbrevBalance(victimBalance)).displayValue} ${prefix(victimBalance)}.`], null, null);
			}
			if (result !== 0 && result?.rawError?.message != "Cannot send messages to this user") {
				log.error(result);
			}
		} catch (error) {
			log.error('DM failed:', error);
		}
	},
};