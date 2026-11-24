const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { loadAnim } = require('#functions/discord/helpers/load');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { pluralValues } = require('#functions/discord/core/pluralValues');
const { dmNotify } = require('#functions/discord/notify/dmNotify');
const { getAPI, postAPI } = require('#functions/discord/api/fetch');
const { pluralValues, prefix } = require('#functions/discord/core/pluralValues');

const useItem = async function (itemList, interaction, qty, guildMember, response) {

    // Initial validation lol
    if (!Number.isSafeInteger(qty) || qty <= 0) {
        await replyContainer(
            interaction,
            "Invalid Quantity",
            ["You must use a positive whole number of items."],
            "warn",
            warning,
            {
                advert: false
            }
        )
        return;
    }

    // Look and see items
    const itemId = String(itemList.name);
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

    const item = convItem(itemId);
    let msg;

    if (!item) {
        await replyContainer(
            interaction,
            "Item Not Found",
            ["This item does not exist."],
            "warn",
            warning,
            {
                advert: false
            }
        )
        return;
    }

    if (item.effects?.multiplier) {
        const result = await postAPI('/currency/multipliers/consume', {
            userId: guildMember.id,
            itemId: itemId,
            qty: qty
        });

        if (result.error) {
            await replyContainer(
                interaction,
                "API Error",
                ["Could not consume multiplier."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        itemList = result.content.inventory;

        const duration = item.effects.multiplier.duration;
        const days = (duration * qty) / (24 * 60 * 60 * 1000);

        msg = `Ate ${(abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}, extending your ${item.effects.multiplier.value}x multiplier by ${days} day${pluralValues(days)}.\nYour multiplier expires <t:${Math.floor(result.content.nextExpiry / 1000)}:R>.\nYou now have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`;
    } else {
        switch (itemId) {

            case "3": {
                const result = await postAPI('/currency/update/bank/consume', {
                    userId: guildMember.id,
                    qty: qty
                });

                if (result.error) {
                    await replyContainer(
                        interaction,
                        "API Error",
                        [result.desc || "Could not consume banknotes."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                itemList = result.content.inventory;
                const bankUser = result.content.vault;

                msg = `Bank balance increased by ${(abbrevBalance(result.content.increase)).displayValue} ${prefix(result.content.increase)}.\nNew Bank balance: ${(abbrevBalance(bankUser.value)).displayValue} / ${(abbrevBalance(bankUser.maxValue)).displayValue}\nYou now have ${itemList.value} banknote${pluralValues(itemList.value)}`;
                break;
            }

            case "200":
            case "201": {
                if (qty > 1000000) {
                    await replyContainer(
                        interaction,
                        "Item Limit",
                        ["You cannot use more than 1 million lootboxes.\n-# How did you even get that?"],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                // Open Lootboxes lol
                await loadAnim(
                    interaction,
                    ["Opening Lootboxes..."],
                    false
                )

                const result = await postAPI('/currency/update/items/lootbox', {
                    userId: guildMember.id,
                    id: Number(itemId),
                    qty: qty
                });

                if (result.error) {
                    await replyContainer(
                        interaction,
                        "API Error",
                        ["Could not open lootbox."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                const lootbox = result.content;

                itemList = lootbox.box;

                const rewardLines = [];

                for (let i = 0; i < lootbox.ids.length; i++) {
                    let rewardName = `Item #${lootbox.ids[i]}`;

                    const rewardItem = convItem(lootbox.ids[i]);
                    rewardName = rewardItem?.name ?? rewardName;

                    const rewardQty = (
                        await abbrevBalance(lootbox.qty[i])
                    ).displayValue;

                    const newBalance = (
                        await abbrevBalance(lootbox.newBalances[i])
                    ).displayValue;

                    rewardLines.push(
                        `- ${rewardName}: ${rewardQty} ` +
                        `(New Amount: ${newBalance} ${rewardName}${pluralValues(lootbox.newBalances[i])});`
                    );
                }

                msg = `You opened ${qty} ${item.name}${pluralValues(qty)}, and got the following:\n` +
                    rewardLines.join('\n') +
                    `\nYou now have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`;
                break;
            }

            default: {
                const result = await postAPI('/currency/update/items', {
                    userId: guildMember.id,
                    id: itemId,
                    amount: -qty,
                });

                if (result.error) {
                    await replyContainer(
                        interaction,
                        "API Error",
                        ["Could not update items."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                itemList = result.content;

                msg = `Ate ${(await abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}, and nothing happened.\nYou now have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`;
                break;
            }
        }
    }

    try {
        await addCommandsUsed(interaction.user);
    } catch (error) {
        console.error('[Currency] Item-use analytics failed:', error);
    }
    await replyContainer(
        interaction,
        "Item used!",
        [msg]
    )

    try {
        const result = await dmNotify(
            guildMember,
            [`You have used ${(await abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)} in the channel ${(response?.resource?.message?.url || interaction.channel?.url || 'this channel')}!\nYour new balance: ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`]
        );

        if (
            result && result !== 0 &&
            result?.rawError?.message !== "Cannot send messages to this user"
        ) {
            console.error('[Currency] Item-use DM failed:', result);
        }
    } catch (error) {
        console.error('[Currency] Item-use DM failed:', error);
    }
};

module.exports = { useItem };
