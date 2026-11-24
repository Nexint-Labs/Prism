const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { dmNotify } = require('#functions/discord/notify/dmNotify');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { warning } = require('#config/discord/visual/botAssets');
const { prefix } = require('#functions/discord/core/pluralValues');
const { confirm } = require('#functions/discord/container/menus/confirm');
const { createContainer } = require('#functions/discord/container/container');
const { queryAPI, postAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription(`Pay a specific user ${prefix(0)}.`)
        .addUserOption(option =>
            option
                .setName('user')
                .setRequired(true)
                .setDescription('The person\'s balance to send to.'))
        .addIntegerOption(option =>
            option
                .setName(`${prefix(0, false, false)}`)
                .setDescription(`The ${prefix(0)} amount to transfer.`))
        .addIntegerOption(option =>
            option
                .setName('zeros')
                .setDescription('The amount of zeroes behind.'))
        .addStringOption(option =>
            option
                .setName('all')
                .setDescription(`Deposit all ${prefix(1)}?`)
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
                [`You can't send ${prefix(0)} to yourself.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }
        const oldBalResult = await queryAPI("/currency/update/balance", {
            userId: interaction.user.id,
            name: getUsername(interaction.user),
        })

        if (oldBalResult.error) {
            await replyContainer(
                interaction,
                "API Error",
                [`Could not transfer ${prefix(0)}.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return null;
        }
        let transfer;
        if (interaction.options.getInteger("zeros") === null) {
            transfer = interaction.options.getInteger(prefix(0, false, false));
        } else {
            transfer = interaction.options.getInteger(prefix(0, false, false)) * Math.pow(10, interaction.options.getInteger("zeros"));
        }
        if (interaction.options.getString("all") === "true") {
            transfer = oldBalResult.content.value
        }
        if (transfer === null || isNaN(transfer)) {
            transfer = 0;
        }
        if (transfer > oldBalResult.content.value) {
            await replyContainer(
                interaction,
                "Payment",
                [`You have insufficient ${prefix(0)} to perform this action.`],
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
                [`Please give ${guildMember.displayName} a positive amount of ${prefix(0)}.`],
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
            [`Are you sure you want to send ${guildMember.username} ${(abbrevBalance(transfer)).displayValue} ${prefix(transfer)}?\nYou have ${(abbrevBalance(oldBalResult.content.value)).displayValue} ${prefix(oldBalResult.content.value)}.`,],
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
        const result = await postAPI("/currency/transfer/balance", {
            userId: interaction.user.id,
            transferId: guildMember.id,
            transferName: getUsername(guildMember),
            name: getUsername(interaction.user),
            amount: transfer,
        })

		if (result.error) {
			if (result.status == 402) {
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
				return null;
			}
			await replyContainer(
				interaction,
				"API Error",
				["Could not pay user."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

        let oldBalanceUser = result.content.userResult;
        let newBalanceUser = result.content.transferResult;
        transfer = abbrevBalance(transfer);

        // Build message
        let msg = `Gave ${newBalanceUser.name} ${transfer.displayValue} ${prefix(transfer.value)}.\nYour new balance: ${(abbrevBalance(oldBalanceUser.value)).displayValue} ${prefix(oldBalanceUser.value)}.\nTheir new balance: ${(abbrevBalance(newBalanceUser.value)).displayValue} ${prefix(newBalanceUser.value)}.`;

        // Analytics
        await addCommandsUsed(interaction.user);

        // Send message + dmNotify
        await replyContainer(
            interaction,
            "Payment",
            [msg],
            "default"
        )
        let result2 = await dmNotify(guildMember, [`${interaction.user.displayName} has sent you ${transfer.displayValue} ${prefix(transfer.value)} in the channel ${response.resource.message.url}!\nYour new balance: ${(abbrevBalance(newBalanceUser.value)).displayValue} ${prefix(newBalanceUser.value)}.`],)
        if (result2 !== 0 && result2.rawError.message != "Cannot send messages to this user") {
            throw result2;
        }
    },
};