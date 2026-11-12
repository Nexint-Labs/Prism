const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { dmNotify } = require('#functions/v2/notify/dmNotify');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { transferBalance } = require('#functions/v2/currency/transactions/transfers');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { pluralValues } = require('#functions/v2/core/pluralValues');
const { confirm } = require('#functions/v2/discord/menus/confirm');
const { createContainer } = require('#functions/v2/discord/container');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('pay')
		.setDescription('Pay a specific user.')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person\'s balance to send to.'))
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

		// opt-out check
		let guildMember = interaction.options.getUser("user");
        if (await optOutChkSingle(interaction.user)) {
            await replyContainer(
                interaction,
                "Payment",
                ["You are opted out. This command will not work."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        if (await optOutChkSingle(guildMember)) {
            await replyContainer(
                interaction,
                "Payment",
                ["This person is opted out. This command will not work."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

		// check if payment is valid
		if (guildMember.id == interaction.user.id) {
            await replyContainer(
                interaction,
                "Payment",
                ["You can't send money to yourself."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
			return;
		}
		let newBalanceUser = await balanceCheck(guildMember);
		let oldBalanceUser = await balanceCheck(interaction.user);
		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			transfer = oldBalanceUser.value;
		}
		if (transfer === null || isNaN(transfer)) {
			transfer = 0;
		}
		if (transfer > oldBalanceUser.value) {
            await replyContainer(
                interaction,
                "Payment",
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
		if (!Number.isFinite(transfer) || transfer <= 0) {
            await replyContainer(
                interaction,
                "Payment",
                [`Please give ${guildMember.displayName} a positive amount of money.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
			return;
		}

		const promptContainer = await createContainer(
            "Payment",
            [`Are you sure you want to send ${guildMember.username} ${(await abbrevBalance(transfer)).displayValue} coin${pluralValues(transfer)}?\nYou have ${(await abbrevBalance(oldBalanceUser.value)).displayValue} coin${pluralValues(oldBalanceUser.value)}.`,],
            "default",
            null,
            {
                copyright: false,
                checkNotif: false,
                advert: false
            }
        );

        const { decision } = await confirm(
            interaction,
            response,
            promptContainer
        );

        if (decision === "cancel") {
            await replyContainer(
                interaction,
                "Payment",
                ["Payment cancelled."],
                "default",
                null,
                {
                    advert: false
                }
            )
            return;
        } else if (decision === "timeout") {
            await replyContainer(
                interaction,
                "Payment",
                ["Confirmation not received within 30 seconds, cancelling."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

		// Perform action
		oldBalanceUser = await balanceCheck(interaction.user);
		if (transfer > oldBalanceUser.value) {
            await replyContainer(
                interaction,
                "Payment",
                [`You have insufficient funds to perform this action.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
			return;
		}
		const result = await transferBalance(
			interaction.user,
			guildMember,
			transfer
		);

		oldBalanceUser = result.senderBalance;
		newBalanceUser = result.recipientBalance;
		transfer = await abbrevBalance(transfer);

		// Build message
		let msg = `Gave ${newBalanceUser.name} ${transfer.displayValue} coin${pluralValues(transfer.value)}.\nYour new balance: ${(await abbrevBalance(oldBalanceUser.value)).displayValue} coin${pluralValues(oldBalanceUser.value)}.\nTheir new balance: ${(await abbrevBalance(newBalanceUser.value)).displayValue} coin${pluralValues(newBalanceUser.value)}.`;

		// Analytics
		await addCommandsUsed(interaction.user);

		// Send message + dmNotify
		await replyContainer(
			interaction,
			"Payment",
			[msg],
			"default"
		)
		let result2 = await dmNotify(guildMember, [`${interaction.user.displayName} has sent you ${transfer.displayValue} coin${pluralValues(transfer.value)} in the channel ${response.resource.message.url}!\nYour new balance: ${(await abbrevBalance(newBalanceUser.value)).displayValue} coin${pluralValues(newBalanceUser.value)}.`],)
		if (result2 !== 0 && result2.rawError.message != "Cannot send messages to this user") {
			throw result2;
		}
	},
};