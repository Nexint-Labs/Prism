
const { SlashCommandBuilder } = require('discord.js');
const { getAPI, queryAPI } = require('#functions/discord/api/fetch');
const { useItem } = require('#functions/discord/currency/useItems');
const { getOwnedConsumables } = require('#functions/discord/currency/autocomplete');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { createContainer } = require('#functions/discord/container/container');
const { pluralValues } = require('#functions/discord/core/pluralValues');
const { confirm } = require('#functions/discord/container/menus/confirm');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');

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

        // Get the catalog
        const catalogResult = await getAPI('/currency/shop');

        if (catalogResult.error) {
            await replyContainer(
                interaction,
                "API Error",
                ["Could not get item catalog."],
                "warn",
                warning,
                {
                    advert: false
                }
            );
            return;
        }

        const catalog = catalogResult.content;

        const convItem = function (id) {
            for (const item of catalog) {
                if (item.id == id) {
                    return item;
                }
            }

            return undefined;
        }

        // set variables up
        let id = interaction.options.getInteger("id");

        if (id === null) {
            const name = interaction.options.getString("name");

            for (const item of catalog) {
                if (item.name.toLowerCase() === name.toLowerCase()) {
                    id = item.id;
                    break;
                }
            }
        }

        let itemList = null;

        if (id !== null) {
            const itemResult = await queryAPI('/currency/update/items/item', {
                userId: guildMember.id,
                id: id
            });

            if (itemResult.error && itemResult.status !== 404) {
                await replyContainer(
                    interaction,
                    "API Error",
                    ["Could not get detailed items."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                );
                return;
            }

            if (!itemResult.error) {
                itemList = itemResult.content.user;
            }
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
        let item = convItem(itemList.name);
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

            const itemResult = await queryAPI('/currency/update/items/item', {
                userId: guildMember.id,
                id: id
            });

            if (itemResult.error && itemResult.status !== 404) {
                await replyContainer(
                    interaction,
                    "API Error",
                    ["Could not get detailed items."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                );
                return;
            }

            itemList = null;
            if (!itemResult.error) {
                itemList = itemResult.content.user;
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

            item = convItem(itemList.name);

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
