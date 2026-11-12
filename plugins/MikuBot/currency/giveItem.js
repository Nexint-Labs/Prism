const { SlashCommandBuilder } = require('discord.js');
const { queryItem, queryItemName } = require('#functions/v2/currency/inventory/inventory');
const { convItem } = require('#functions/v2/currency/inventory/catalog');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { transferItem } = require('#functions/v2/currency/transactions/transfers');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { createContainer } = require('#functions/v2/discord/container');
const { dmNotify } = require('#functions/v2/notify/dmNotify');
const { pluralValues } = require('#functions/v2/core/pluralValues');
const { confirm } = require('#functions/v2/discord/menus/confirm');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Gives an item to someone! (WIP)')
        .addUserOption(option =>
            option
                .setName('user')
                .setRequired(true)
                .setDescription('The person\'s balance to send to.'))
        .addStringOption(option =>
            option
                .setName('name')
                .setRequired(true)
                .setDescription('The item name to give.'))
        .addIntegerOption(option =>
            option
                .setName('qty')
                .setRequired(true)
                .setDescription('The quantity of item to give.'))
        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('The item ID to give. Overrides name.')),
    async execute(interaction) {

        // setup some variables
        let guildMember = interaction.options.getUser("user");

        // defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        if (await optOutChkSingle(guildMember)) {
            await replyContainer(
                interaction,
                "Give",
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
                "Give",
                ["You are opted out. This command will not work."],
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
                "Give",
                ["You can't give items to yourself."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // set variables up
        let id = interaction.options.getInteger("id");
        let itemList;
        if (id === null) {
            itemList = await queryItemName(interaction.options.getString("name"), interaction.user);
        } else {
            itemList = await queryItem(interaction.options.getInteger("id"), interaction.user);
        }
        let qty = interaction.options.getInteger("qty");
        if (qty === null) {
            qty = 1;
        }

        // Make sure user has enough of the item, and that item actually exists
        if (itemList === undefined) {
            await replyContainer(
                interaction,
                "Give",
                ["This item does not exist."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // item quantity checks
        let item = await convItem(itemList.name);
        if (itemList.value < qty) {
            await replyContainer(
                interaction,
                "Give",
                [`You do not have enough ${item.name}.\nYou only have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }
        if (qty < 1) {
            await replyContainer(
                interaction,
                "Give",
                [`You must input a positive number for the quantity.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        const promptContainer = await createContainer(
            "Give",
            [`Are you sure you want to send ${guildMember.username} ${(await abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}?\nYou have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`,],
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
                "Give",
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
                "Give",
                ["Confirmation not received within 30 seconds, cancelling."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;

        }

        if (id === null) {
            itemList = await queryItemName(interaction.options.getString("name"), interaction.user);
        } else {
            itemList = await queryItem(interaction.options.getInteger("id"), interaction.user);
        }

        // item quantity checks
        if (!itemList) {
            await replyContainer(
                interaction,
                "Give",
                ["You no longer have this item."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }
        item = await convItem(itemList.name);

        if (itemList.value < qty) {
            await replyContainer(
                interaction,
                "Give",
                [`You do not have enough ${item.name}.\nYou only have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // Get the item
        const result = await transferItem(
            interaction.user,
            guildMember,
            itemList.name,
            qty
        );

        itemList = result.senderItem;
        let itemReceive = result.recipientItem;

        // Build message
        let msg = `Gave ${guildMember.username} ${(await abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}.\nYour new balance: ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.\nTheir new balance: ${(await abbrevBalance(itemReceive.value)).displayValue} ${item.name}${pluralValues(itemReceive.value)}.`;

        // Analytics
        await addCommandsUsed(interaction.user);

        // Send message + dmNotify
        await replyContainer(
            interaction,
            "Give",
            [msg],
            "default",
        )
        let result2 = await dmNotify(
            guildMember,
            [`${interaction.user.displayName} has sent you ${(await abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)} in the channel ${response.resource.message.url}!\nYour new balance: ${(await abbrevBalance(itemReceive.value)).displayValue} ${item.name}${pluralValues(itemReceive.value)}.`],
        )
        if (result2 !== 0 && result2.rawError.message != "Cannot send messages to this user") {
            throw result2;
        }

    },
};