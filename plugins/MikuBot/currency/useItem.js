const { SlashCommandBuilder } = require('discord.js');
const { queryItem, queryItemName } = require('#functions/v2/currency/inventory/inventory');
const { convItem } = require('#functions/v2/currency/inventory/catalog');
const { useItem } = require('#functions/v2/currency/inventory/useItems');
const { getOwnedConsumables } = require('#functions/v2/currency/inventory/autocomplete');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { createContainer } = require('#functions/v2/discord/container');
const { pluralValues } = require('#functions/v2/core/pluralValues');
const { confirm } = require('#functions/v2/discord/menus/confirm');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('use')
        .setDescription('Use an item!')
        .addStringOption(option =>
            option
                .setName('name')
                .setRequired(true)
                .setAutocomplete(true)
                .setDescription('The item name to use.'))
        .addIntegerOption(option =>
            option
                .setName('qty')
                .setDescription('The quantity of item to use.'))
        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('The item ID to use. Overrides name.')),
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();

        try {
            const choices = await getOwnedConsumables(
                interaction.user,
                focused
            );

            if (choices.length === 0) {
                choices.push({
                    name: "No matching owned consumable items.",
                    value: "__NO_MATCH__"
                })
            }

            await interaction.respond(choices);
        } catch (error) {
            console.error('[Currency] Item autocomplete failed:', error);

            if (!interaction.responded) {
                await interaction.respond([]).catch(() => { });
            }
        }
    },
    async execute(interaction) {
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        if (await optOutChkSingle(interaction.user)) {
            await replyContainer(
                interaction,
                "Use Item",
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

        // set variables up
        let id = interaction.options.getInteger("id");
        let itemList;
        if (id === null) {
            itemList = await queryItemName(interaction.options.getString("name"), guildMember);
        } else {
            itemList = await queryItem(interaction.options.getInteger("id"), guildMember);
        }
        let qty = interaction.options.getInteger("qty");
        if (qty === null) {
            qty = 1;
        }
        if (qty < 1) {
            await replyContainer(
                interaction,
                "Use Item",
                ["You must have a positive quantity."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return
        }

        // Make sure user has enough of the item, and that item actually exists
        if (!itemList) {
            await replyContainer(
                interaction,
                "Use Item",
                ["This item does not exist."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }
        let item = await convItem(itemList.name);
        if (!item) {
            await replyContainer(
                interaction,
                "Use Item",
                ["This item no longer exists."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }
        if (itemList.value < qty) {
            await replyContainer(
                interaction,
                "Use Item",
                [`You do not have enough ${item.name}.\nYou only have ${itemList.value} ${item.name}${pluralValues(itemList.value)}.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // Switch
        if (item.effects.consumable) {

            const promptContainer = await createContainer(
                "Use Item",
                [`Are you sure you want to use / eat ${(await abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}?`,],
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
                    "Use Item",
                    ["Use Item cancelled."],
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
                    "Use Item",
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
                itemList = await queryItemName(interaction.options.getString("name"), guildMember);
            } else {
                itemList = await queryItem(interaction.options.getInteger("id"), guildMember);
            }

            if (!itemList) {
                await replyContainer(
                    interaction,
                    "Use Item",
                    [`You no longer have this item.`],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return;
            }

            item = await convItem(itemList.name);

            if (!item) {
                await replyContainer(
                    interaction,
                    "Use Item",
                    ["This item no longer exists."],
                    "warn",
                    warning,
                    { advert: false }
                );
                return;
            }
            if (itemList.value < qty) {
                await replyContainer(
                    interaction,
                    "Use Item",
                    [`You do not have enough ${item.name}.\nYou only have ${itemList.value} ${item.name}${pluralValues(itemList.value)}.`],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return;
            }


            if (!item.effects.consumable) {
                await replyContainer(
                    interaction,
                    "Use Item",
                    [`This item is non consumable.`],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return;

            }

            // useItem abstraction (since this code is duped)
            await useItem(itemList, interaction, qty, guildMember, response);
            return;
        }

        // Error message
        await replyContainer(
            interaction,
            "Use Item",
            [`This item is non consumable.`],
            "warn",
            warning,
            {
                advert: false
            }
        )
        return;
    },
};