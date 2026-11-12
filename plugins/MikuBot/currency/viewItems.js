const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { queryItem } = require('#functions/v2/currency/inventory/inventory');
const { convItem } = require('#functions/v2/currency/inventory/catalog');
const { convNameToID } = require('#functions/v2/currency/accounts/balances');
const { getUser } = require('#functions/v2/discord/shardInfo');
const { useItem } = require('#functions/v2/currency/inventory/useItems');
const { followUpNotif } = require('#functions/v2/notify/checkNotifs');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { warning } = require('#config/visual/botAssets');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { createContainer, createAdvancedContainer } = require('#functions/v2/discord/container');
const { handleInteractionError } = require('#functions/v2/helpers/handleInteractionError');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('inv')
        .setDescription('View anyone\'s inventory!')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The person\'s inventory to check. Defaults to yourself.'))
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('The person\'s inventory to check by name. Overridden by user.'))
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('The person\'s inventory to check. Overridden by user.'))
        .addIntegerOption(option =>
            option
                .setName('qty')
                .setDescription('The quantity of item to use.')),
    async execute(interaction) {
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        // Get current user
        let guildMember = interaction.options.getUser("user");
        if (guildMember === null) {
            let userID = interaction.options.getString("id");
            if (interaction.options.getString("name") !== null && userID === null) {
                userID = await convNameToID(interaction.options.getString("name"));
            }
            if (userID != null) {
                guildMember = await getUser(userID);
            } else if (interaction.options.getString("name") === null) {
                guildMember = interaction.user;
            }
            if (guildMember == null) {
                await replyContainer(
                    interaction,
                    "Inventory",
                    ["This target does not exist."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return
            }
        }

        // check for opt out

        if (await optOutChkSingle(guildMember)) {
            await replyContainer(
                interaction,
                "Inventory",
                ["The target is already opted out. This command will not work."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // Pull the items
        let itemList = await queryItem(undefined, guildMember);
        let itemListLength = 1;
        let qty = interaction.options.getInteger("qty");
        if (qty === null) {
            qty = 1;
        }

        let page = 1; // item page count
        let maxPage = Math.ceil(itemList.length / itemListLength);

        // shortened?
        let shortened = interaction.options.getBoolean("short");
        if (shortened === null) {
            shortened = true;
        }

        const store = async function () {

            // special case if you have no items
            if (itemList.length == 0) {
                let msg = `${guildMember.displayName} has no items in their inventory.`
                if (guildMember.displayName == undefined) {
                    msg = `${guildMember.globalName} has no items in their inventory.`;
                }
                if (guildMember.id == interaction.user.id) {
                    msg = `You have no items in your inventory.`;
                }
                return await createContainer(
                    "Inventory",
                    [msg],
                    "default"
                );
            }

            // Build inventory
            let msg = "";
            let titleDescArray = [];
            for (let i = 0; i < itemListLength; i++) {
                if (itemList[i + (page - 1) * itemListLength] != undefined) {
                    let item = await convItem(itemList[i + (page - 1) * itemListLength].name);
                    if (!item) {
                        titleDescArray.push("This item no longer exists in the catalog.");
                        continue;
                    }
                    if (item != undefined) {
                        msg = ""
                        titleDescArray.push(`Item ${i + 1 + (page - 1) * itemListLength}: ${item.name}`);
                        msg += `Description: ${item.desc}`;
                        if (shortened) {
                            msg += `\nQuantity: ${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value)).displayValue}`;
                            if (item.value > 0) {
                                msg += `\nValue: ${(await abbrevBalance((item.value) * (itemList[i + (page - 1) * itemListLength].value))).displayValue} (${(await abbrevBalance(item.value)).displayValue} x ${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value)).displayValue})`;
                            } else {
                                msg += `\nThis item has no set value!`
                            }
                        } else {
                            msg += `\nQuantity: ${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value)).value}`;
                            if (item.value > 0) {
                                msg += `\nValue: ${(await abbrevBalance((item.value) * (itemList[i + (page - 1) * itemListLength].value))).value} (${(await abbrevBalance(item.value)).value} x ${(await abbrevBalance(itemList[i + (page - 1) * itemListLength].value)).value})`;
                            } else {
                                msg += `\nThis item has no set value!`
                            }
                        }

                        msg += `\n-# ID: ${itemList[i + (page - 1) * itemListLength].name}`;
                        titleDescArray.push(msg);
                    }
                }
            }
            msg = `${guildMember.displayName}'s inventory:`;
            if (guildMember.displayName == undefined) {
                msg = `${guildMember.globalName}'s inventory:`;
            }
            if (guildMember.id == interaction.user.id) {
                msg = `Your inventory:`;
            }

            const components = [];
            components.push({
                type: "text",
                content: `### Inventory`
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
        if (itemList.length === 0) {
            await interaction.editReply({
                components: [userContainer],
                flags: MessageFlags.IsComponentsV2
            });
            return;
        }

        // Action row for items
        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("back")
                .setLabel('<--')
                .setStyle(ButtonStyle.Secondary)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("prev")
                .setLabel('<')
                .setStyle(ButtonStyle.Primary)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("next")
                .setLabel('>')
                .setStyle(ButtonStyle.Primary)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("max")
                .setLabel('-->')
                .setStyle(ButtonStyle.Secondary)
        );
        if (guildMember.id == interaction.user.id) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("use")
                    .setLabel('Use')
                    .setStyle(ButtonStyle.Success)
            );
        }

        // Second row for confirm / back
        const rowBuild2 = function (cont) {
            let row = new ActionRowBuilder();
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

        // Send the reply
        await interaction.editReply({
            components: [userContainer, row],
            flags: MessageFlags.IsComponentsV2
        });

        await followUpNotif(interaction);

        let row2 = rowBuild2();

        // Shop function
        const shop = async function () {
            const collectorFilter = i => i.user.id === interaction.user.id;
            while (true) {
                try {
                    const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

                    if (confirmation.customId == "back") {
                        page = 1;
                    }
                    if (confirmation.customId == "prev") {
                        page -= 1;
                        if (page < 1) {
                            page = maxPage;
                        }
                    }
                    if (confirmation.customId == "next") {
                        page += 1;
                        if (page > maxPage) {
                            page = 1;
                        }
                    }
                    if (confirmation.customId == "max") {
                        page = maxPage
                    }

                    if (confirmation.customId == "use") {
                        if (itemList[page - 1].value > 0) {
                            let item = await convItem(itemList[page - 1].name);
                            if (!item) {
                                userContainer = await createContainer(
                                    "Inventory",
                                    ["This item no longer exists in the catalog."],
                                    "warn",
                                    warning,
                                    {
                                        advert: false
                                    }
                                )
                                row2 = await rowBuild2(false);
                                await confirmation.update({
                                    components: [userContainer, row2],
                                    flags: MessageFlags.IsComponentsV2
                                });
                                continue;
                            }
                            if (item.effects?.consumable) {
                                userContainer = await createContainer(
                                    "Inventory",
                                    ["Are you sure you want to use / eat this item?"],
                                    "default"
                                )
                                row2 = await rowBuild2(true);
                                await confirmation.update({
                                    components: [userContainer, row2],
                                    flags: MessageFlags.IsComponentsV2
                                });
                                continue;
                            } else {
                                userContainer = await createContainer(
                                    "Inventory",
                                    ["This item is non consumable."],
                                    "default"
                                )
                                row2 = await rowBuild2(false);
                                await confirmation.update({
                                    components: [userContainer, row2],
                                    flags: MessageFlags.IsComponentsV2
                                });
                                continue;
                            }
                        } else {
                            userContainer = await createContainer(
                                "Inventory",
                                ["You do not have any of this item."],
                                "default"
                            )
                            row2 = await rowBuild2(false);
                            await confirmation.update({
                                components: [userContainer, row2],
                                flags: MessageFlags.IsComponentsV2
                            });
                            continue;
                        }
                    }
                    if (confirmation.customId === "cont") {
                        await confirmation.deferUpdate();

                        const selected = itemList[page - 1];

                        if (!selected) {
                            await replyContainer(
                                interaction,
                                "Inventory",
                                ["Item not found."],
                                "warn",
                                warning,
                                {
                                    advert: false
                                }
                            );
                            return;
                        }

                        const currentItem = await queryItem(selected.name, interaction.user);

                        if (!currentItem || currentItem.value < qty) {
                            await replyContainer(
                                interaction,
                                "Inventory",
                                ["You no longer have enough of this item."],
                                "warn",
                                warning,
                                {
                                    advert: false
                                }
                            );
                            return;
                        }

                        if (!Number.isSafeInteger(qty) || qty < 1) {
                            await replyContainer(
                                interaction,
                                "Inventory",
                                ["Quantity must be positive."],
                                "warn",
                                warning,
                                {
                                    advert: false
                                }
                            );
                            return;
                        }

                        const catalogItem = await convItem(selected.name);

                        if (!catalogItem?.effects?.consumable) {
                            await replyContainer(
                                interaction,
                                "Inventory",
                                ["This item is no longer consumable."],
                                "warn",
                                warning,
                                { advert: false }
                            );
                            return;
                        }

                        await useItem(currentItem, interaction, qty, guildMember, response);
                        return;
                    }
                    userContainer = await store();
                    await confirmation.update({
                        components: [userContainer, row],
                        flags: MessageFlags.IsComponentsV2
                    });
                    continue;
                } catch (error) {
                    await handleInteractionError(interaction, response, error)
                    return;
                }

            }
        }

        await shop();
        return;

        // Check for button input

    },
};