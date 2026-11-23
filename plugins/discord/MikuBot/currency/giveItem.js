const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { createContainer } = require('#functions/discord/container/container');
const { dmNotify } = require('#functions/discord/notify/dmNotify');
const { pluralValues } = require('#functions/discord/core/pluralValues');
const { confirm } = require('#functions/discord/container/menus/confirm');
const { postAPI, queryAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');

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
        const id = interaction.options.getInteger("id");
        const itemName = interaction.options.getString("name");
        const itemId = id ?? itemName;
        const qty = interaction.options.getInteger("qty");

        const itemResult = await queryAPI("/currency/update/items/item", {
            userId: interaction.user.id,
            id: itemId
        });

        if (itemResult.error) {
            if (itemResult.status === 404) {
                await replyContainer(
                    interaction,
                    "Give",
                    ["You do not have this item."],
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
                ["Could not retrieve inventory."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        let itemList = itemResult.content.user;

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
        const item = {
            name: itemResult.content.name
        };
        if (itemList.value < qty) {
            await replyContainer(
                interaction,
                "Give",
                [`You do not have enough ${item.name}.\nYou only have ${(abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`],
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
            [`Are you sure you want to send ${guildMember.username} ${(abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}?\nYou have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`,],
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

        const result = await postAPI("/currency/transfer/items", {
            userId: interaction.user.id,
            name: getUsername(interaction.user),
            transferId: guildMember.id,
            transferName: getUsername(guildMember),
            itemId: itemList.name,
            amount: qty
        });

        if (result.error) {
            if (result.status === 402) {
                await replyContainer(
                    interaction,
                    "Give",
                    ["You do not have enough of this item."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return null;
            }
            if (result.status === 404) {
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
                return null;
            }
            await replyContainer(
                interaction,
                "API Error",
                ["Could not transfer items."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        itemList = result.content.userResult;
        let itemReceive = result.content.transferResult;

        // Build message
        let msg = `Gave ${guildMember.username} ${(abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}.\nYour new balance: ${(abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.\nTheir new balance: ${(await abbrevBalance(itemReceive.value)).displayValue} ${item.name}${pluralValues(itemReceive.value)}.`;

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
            [`${interaction.user.displayName} has sent you ${(abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)} in the channel ${response.resource.message.url}!\nYour new balance: ${(abbrevBalance(itemReceive.value)).displayValue} ${item.name}${pluralValues(itemReceive.value)}.`],
        )
        if (result2 !== 0 && result2.rawError.message != "Cannot send messages to this user") {
            throw result2;
        }

    },
};