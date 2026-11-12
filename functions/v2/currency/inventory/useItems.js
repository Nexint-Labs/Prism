const { convItem } = require('#functions/v2/currency/inventory/catalog');
const { updateItemAtomic } = require('#functions/v2/currency/inventory/inventory');
const { consumeBanknotes, consumeLootbox, consumeMulti } = require('#functions/v2/currency/inventory/consumables');

const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { loadAnim } = require('#functions/v2/helpers/load');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { pluralValues } = require('#functions/v2/core/pluralValues');
const { dmNotify } = require('#functions/v2/notify/dmNotify');

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
    const item = await convItem(itemId);
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
        const result = await consumeMulti(guildMember, itemId, qty);
        itemList = result.inventory;

        const duration = item.effects.multiplier.duration;
        const days = (duration * qty) / (24 * 60 * 60 * 1000);

        msg = `Ate ${(await abbrevBalance(qty)).displayValue} ${item.name}${pluralValues(qty)}, extending your ${item.effects.multiplier.value}x multiplier by ${days} day${pluralValues(days)}.\nYour multiplier expires <t:${Math.floor(result.nextExpiry / 1000)}:R>.\nYou now have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`;
    } else {
        switch (itemId) {

            case "3": {
                const result = await consumeBanknotes(guildMember, qty);

                itemList = result.inventory;
                const bankUser = result.vault;

                msg = `Bank balance increased by ${(await abbrevBalance(result.increase)).displayValue} coin${pluralValues(result.increase)}.\nNew Bank balance: ${(await abbrevBalance(bankUser.value)).displayValue} / ${(await abbrevBalance(bankUser.maxValue)).displayValue}\nYou now have ${itemList.value} banknote${pluralValues(itemList.value)}`;
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

                const result = await consumeLootbox(
                    guildMember,
                    Number(itemId),
                    qty
                );

                itemList = result.box;

                const rewardLines = [];

                for (let i = 0; i < result.rewards.ids.length; i++) {
                    let rewardName = `Item #${result.rewards.ids[i]}`;

                    try {
                        const rewardItem = await convItem(result.rewards.ids[i]);
                        rewardName = rewardItem?.name ?? rewardName;
                    } catch (error) {
                        console.error('[Currency] Reward metadata lookup failed:', error);
                    }

                    const rewardQty = (
                        await abbrevBalance(result.rewards.qty[i])
                    ).displayValue;

                    const newBalance = (
                        await abbrevBalance(result.rewardBalances[i])
                    ).displayValue;

                    rewardLines.push(
                        `- ${rewardName}: ${rewardQty} ` +
                        `(New Amount: ${newBalance} ${rewardName}${pluralValues(result.rewardBalances[i])});`
                    );
                }

                msg = `You opened ${qty} ${item.name}${pluralValues(qty)}, and got the following:\n` +
                    rewardLines.join('\n') +
                    `\nYou now have ${(await abbrevBalance(itemList.value)).displayValue} ${item.name}${pluralValues(itemList.value)}.`;
                break;
            }

            default: {
                itemList = await updateItemAtomic(
                    guildMember,
                    itemId,
                    -qty
                );

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
