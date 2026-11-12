const { SlashCommandBuilder } = require('discord.js');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { updateMulti } = require('#functions/v2/currency/accounts/multipliers');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { short } = require('#functions/v2/discord/menus/short');
const { request, member } = require('#functions/v2/currency/apiRead');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { createContainer } = require('#functions/v2/discord/container');
const { warning } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { pluralValues } = require('#functions/v2/core/pluralValues');

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription('Beg to gain money for the balance system. Cooldown of 30 seconds.'),
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

        await updateMulti(guildMember);
        const reward = await request('beg', member(guildMember));
        let addedCoins = await abbrevBalance(reward.addedCoins);
        let newCoinAmt = await abbrevBalance(reward.balance);

		let level = await expGain(guildMember);

		// build message
		const containerBuild = async function (shortened) {

			// Prepare message
			let msg = "";
			if (shortened) {
				msg = `You decided to beg and got ${addedCoins.displayValue} coin${pluralValues(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.displayValue} coin${pluralValues(newCoinAmt.value)}}.`;
				if (addedCoins.value == 0) {
					msg = `You decided to beg, but got ABSOLUTELY NOTHING BOZO.\n\nYour updated balance: ${newCoinAmt.displayValue} coin${pluralValues(newCoinAmt.value)}.`
				} else if (reward.massiveTip) {
					msg = `You decided to beg and got a massive tip from a rich person, resulting in ${addedCoins.displayValue} coin${pluralValues(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.displayValue} coin${pluralValues(newCoinAmt.value)}.`
				}
			} else {
				msg = `You decided to beg and got ${addedCoins.value} coin${pluralValues(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.value} coin${pluralValues(newCoinAmt.value)}.`;
				if (addedCoins.value == 0) {
					msg = `You decided to beg, but got ABSOLUTELY NOTHING BOZO.\n\nYour updated balance: ${newCoinAmt.value} coi${pluralValues(newCoinAmt.value)}.`
				} else if (reward.massiveTip) {
					msg = `You decided to beg and got a massive tip from a rich person, resulting in ${addedCoins.value} coin${pluralValues(addedCoins.value)}.\n\nYour updated balance: ${newCoinAmt.value} coin${pluralValues(newCoinAmt.value)}.`
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