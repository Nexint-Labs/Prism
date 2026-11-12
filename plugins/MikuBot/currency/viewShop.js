const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { buyItem } = require('#functions/v2/currency/inventory/purchases');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { request } = require('#functions/v2/currency/apiRead');
const { followUpNotif } = require('#functions/v2/notify/checkNotifs');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { warning } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { createAdvancedContainer, createContainer } = require('#functions/v2/discord/container');
const { handleInteractionError } = require('#functions/v2/helpers/handleInteractionError');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { pluralValues } = require('#functions/v2/core/pluralValues');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the items on the shop! (Version 2)')
        .addIntegerOption(option =>
            option
                .setName('qty')
                .setDescription('The quantity of item to shop for.')),
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
                "Shop",
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
        let shortened = true;

        // Pull the items
        const catalog = await request('getItemCatalog', {});
        if (!Array.isArray(catalog)) throw new Error('INVALID_ITEM_CATALOG');
        let itemList = [];
        let itemListLength = 2;
        for (let i = 0; i < catalog.length; i++) {
            if (catalog[i].available == true) {
                itemList.push(catalog[i]);
            }
        }
        let qty = interaction.options.getInteger("qty");
        if (qty === null) {
            qty = 1;
        }
        if (qty < 1) {
            await replyContainer(
                interaction,
                "Shop",
                ["Quantity must be positive."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        let page = 1; // store page count
        let maxPage = Math.ceil(itemList.length / itemListLength);

        // Action row for items
        const rowBuild = async function () {

            // Build storefront
            let count = 0;
            let rows = new ActionRowBuilder();
            for (let i = 0; i < itemListLength; i++) {
                if (itemList[i + (page - 1) * itemListLength] != undefined) {
                    count += 1;
                }
            }
            rows.addComponents(
                new ButtonBuilder()
                    .setCustomId("back")
                    .setLabel('<')
                    .setStyle(ButtonStyle.Secondary)
            );
            for (let i = 0; i < count; i++) {
                rows.addComponents(
                    new ButtonBuilder()
                        .setCustomId(i.toString())
                        .setLabel((i + 1).toString())
                        .setStyle(ButtonStyle.Primary)
                );
            }
            rows.addComponents(
                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel('>')
                    .setStyle(ButtonStyle.Secondary)
            );

            // Shortened row actionbar?
            if (shortened) {
                rows.addComponents(
                    new ButtonBuilder()
                        .setCustomId("short")
                        .setLabel('Short? ✔')
                        .setStyle(ButtonStyle.Success)
                );
            } else {
                rows.addComponents(
                    new ButtonBuilder()
                        .setCustomId("short")
                        .setLabel('Short? ❌')
                        .setStyle(ButtonStyle.Danger)
                );
            }
            return rows;
        }
        const rowBuild2 = async function (cont) {
            row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("back2")
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Danger)
            );
            if (cont) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId("cont")
                        .setLabel('Continue')
                        .setStyle(ButtonStyle.Success)
                );
            }
            return row;
        }
        let row = await rowBuild();

        const store = async function () {
            // Build storefront
            let msg = "";
            let count = 0;
            let titleDescArray = [];
            for (let i = 0; i < itemListLength; i++) {
                if (itemList[i + (page - 1) * itemListLength] != undefined) {
                    msg = "";

                    // title
                    titleDescArray.push(`Item ${i + 1}: ${itemList[i + (page - 1) * itemListLength].name}`);

                    // desc
                    msg += `Description: ${itemList[i + (page - 1) * itemListLength].desc}`
                    if (shortened) {
                        msg += `\nPrice: ${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value * qty)).displayValue} (${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value)).displayValue} x ${(await abbrevBalance(qty)).displayValue})`;
                    } else {
                        msg += `\nPrice: ${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value * qty)).value} (${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value)).value} x ${(await abbrevBalance(qty)).value})`;
                    }
                    msg += `\n-# ID: ${itemList[i + (page - 1) * itemListLength].id}`;
                    titleDescArray.push(msg);
                    count += 1;
                }
            }
            msg = "Buy something from the shop!"
            msg += "\n-# Page #" + page + " / " + maxPage;
            const components = [];
            components.push({
                type: "text",
                content: `### Shop`
            })
            components.push({
                type: "text",
                content: msg
            })

            for (let i = 0; i < titleDescArray.length; i++) {
                components.push({
                    type: "separator",
                    divider: true,
                    spacing: 1
                })
                components.push({
                    type: "text",
                    content: `**${titleDescArray[i]}**`
                });
                i += 1;
                components.push({
                    type: "text",
                    content: titleDescArray[i]
                });
            }
            let container = await createAdvancedContainer({
                color: "default",
                components: components,
                advert: false,
                copyright: true
            })
            return container;
        }

        let userContainer = await store();

        // Helper function


        // Send the reply
        await interaction.editReply({
            components: [userContainer, row],
            flags: MessageFlags.IsComponentsV2
        });

        await followUpNotif(interaction);

        // Shop function
        const shop = async function (item) {
            let msg;
            let selectedItem = item;
            const collectorFilter = i => i.user.id === interaction.user.id;
            while (true) {
                try {
                    const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

                    // Back / next page
                    if (confirmation.customId == "back") {
                        page -= 1;
                        if (page < 1) {
                            page = maxPage;
                        }
                        row = await rowBuild();
                        userContainer = await store();
                        await confirmation.update({
                            components: [userContainer, row],
                            flags: MessageFlags.IsComponentsV2
                        })
                        continue;
                    }
                    if (confirmation.customId == "next") {
                        page += 1;
                        if (page > maxPage) {
                            page = 1;
                        }
                        row = await rowBuild();
                        userContainer = await store();
                        await confirmation.update({
                            components: [userContainer, row],
                            flags: MessageFlags.IsComponentsV2
                        })
                        continue;
                    }

                    // go back
                    if (confirmation.customId == "back2") {
                        row = await rowBuild();
                        userContainer = await store();
                        await confirmation.update({
                            components: [userContainer, row],
                            flags: MessageFlags.IsComponentsV2
                        })
                        selectedItem = undefined;
                        continue;
                    }

                    // short?
                    if (confirmation.customId == "short") {
                        shortened = !shortened;
                        row = await rowBuild();
                        userContainer = await store();
                        await confirmation.update({
                            components: [userContainer, row],
                            flags: MessageFlags.IsComponentsV2
                        })
                        continue;
                    }

                    // Get the right item
                    if (selectedItem === undefined) {
                        selectedItem = Number(confirmation.customId) + ((page - 1) * itemListLength);
                    }

                    // Make sure the item actually exists.
                    if (itemList[selectedItem] === undefined) {
                        // Send message
                        row = await rowBuild2(false);
                        userContainer = await createContainer(
                            "Shop",
                            ["This item doesn't exist."],
                            "warn",
                            warning,
                            {
                                advert: false
                            }
                        )
                        await confirmation.update({
                            components: [userContainer, row],
                            flags: MessageFlags.IsComponentsV2
                        })
                        continue;
                    }

                    // Confirm or deny?
                    if (confirmation.customId != "cont") {
                        let balanceUser = await balanceCheck(guildMember);

                        // If we don't have enough money, we send an error message.
                        if (balanceUser.value < itemList[selectedItem].value * qty) {
                            row = await rowBuild2(false);
                            userContainer = await createContainer(
                                "Shop",
                                ["You do not have enough money."],
                                "warn",
                                warning,
                                {
                                    advert: false
                                }
                            )
                            await confirmation.update({
                                components: [userContainer, row],
                                flags: MessageFlags.IsComponentsV2
                            })
                            continue;
                        }

                        // Confirmation prompt.
                        if (shortened) {
                            msg = `Are you sure you want to purchase ${(await abbrevBalance(qty)).displayValue} ${itemList[selectedItem].name}${pluralValues(qty)}?\n-# This purchase is worth ${(await abbrevBalance(itemList[selectedItem].value * qty)).displayValue} coin${pluralValues(itemList[selectedItem].value * qty)}.`;
                        } else {
                            msg = `Are you sure you want to purchase ${(await abbrevBalance(qty)).value} ${itemList[selectedItem].name}${pluralValues(qty)}?\n-# This purchase is worth ${(await abbrevBalance(itemList[selectedItem].value * qty)).value} coin${pluralValues(itemList[selectedItem].value * qty)}.`;
                        }
                        userContainer = await createContainer(
                            "Shop",
                            [msg],
                            "default"
                        )
                        row = await rowBuild2(true);
                        await confirmation.update({
                            components: [userContainer, row],
                            flags: MessageFlags.IsComponentsV2
                        })
                        continue;
                    }

                    // analytics
                    addCommandsUsed(interaction.user);

                    // buy item
                    let bought = await buyItem(itemList[selectedItem].id, guildMember, qty);

                    // Holdover from previous code. This should not be run, but a safeguard regardless.
                    if (bought === false) {
                        // Send message
                        userContainer = await createContainer(
                            "Shop",
                            ["You do not have enough money."],
                            "default"
                        )
                        await confirmation.update({
                            components: [userContainer],
                            flags: MessageFlags.IsComponentsV2
                        })
                        return;
                    }

                    // Send message
                    if (shortened) {
                        msg = `You have now bought ${(await abbrevBalance(qty)).displayValue} ${itemList[selectedItem].name}${pluralValues(qty)} (ID: ${bought.itemUser.name})!\n\nYou now have ${(await abbrevBalance(bought.itemUser.value)).displayValue} ${itemList[selectedItem].name}${pluralValues(bought.itemUser.value)}.\nYour updated balance is now ${(await abbrevBalance(bought.user.value)).displayValue} coin${pluralValues(bought.user.value)}.`;
                    } else {
                        msg = `You have now bought ${(await abbrevBalance(qty)).value} ${itemList[selectedItem].name}${pluralValues(qty)} (ID: ${bought.itemUser.name})!\n\nYou now have ${(await abbrevBalance(bought.itemUser.value)).value} ${itemList[selectedItem].name}${pluralValues(bought.itemUser.value)}.\nYour updated balance is now ${(await abbrevBalance(bought.user.value)).value} coin${pluralValues(bought.user.value)}.`;
                    }
                    userContainer = await createContainer(
                        "Shop",
                        [msg],
                        "default"
                    )
                    await confirmation.update({
                        components: [userContainer],
                        flags: MessageFlags.IsComponentsV2
                    })
                    return;
                } catch (error) {

                    await handleInteractionError(interaction, response, error);
                    return;
                }

            }
        }

        await shop();
        return;

        // Check for button input

    },
};