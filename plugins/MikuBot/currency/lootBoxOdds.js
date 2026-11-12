const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getLootBox } = require('#functions/v2/currency/inventory/lootbox');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { queryItem, queryItemName } = require('#functions/v2/currency/inventory/inventory');
const { convItem } = require('#functions/v2/currency/inventory/catalog');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('lootbox')
        .setDescription('View lootbox odds!')
        .addStringOption(option =>
            option
                .setName('name')
                .setRequired(true)
                .setDescription('The item name to give.'))
        .addIntegerOption(option =>
            option
                .setName('id')
                .setDescription('The item ID to give. Overrides name.')),
    async execute(interaction) {
        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        if (await optOutChkSingle(interaction.user)) {
            await replyContainer(
                interaction,
                "LootBox",
                ["You are opted out. This command will not work."],
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

        // lootbox
        let id = interaction.options.getInteger("id");
        let itemList;
        if (id === null) {
            itemList = await queryItemName(interaction.options.getString("name"), guildMember);
        } else {
            itemList = await queryItem(interaction.options.getInteger("id"), guildMember);
        }

        // Make sure that item actually exists
        if (itemList === undefined) {
            await replyContainer(
                interaction,
                "LootBox",
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
        let lootBox = item.id;

        switch (lootBox) {
            case 200:
            case 201:
                break;
            default:
                // Send the chances
                await replyContainer(
                    interaction,
                    "LootBox",
                    ["The item specified is not a lootbox."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return;
        }

        const lootBoxOdds = await getLootBox(lootBox);

        const gcd = function (a, b) {
            if (b == 0) {
                return a;
            }
            return gcd(b, a % b);
        };

        let message = `Chances of ${(await convItem(lootBox)).name}:`

        for (let i = 0; i < lootBoxOdds.chance.length; i++) {
            let numGCD = gcd(lootBoxOdds.numericChance[i], lootBoxOdds.totalChance);
            message += `\n- ${lootBoxOdds.qty[i]}x ${(await convItem(lootBoxOdds.ids[i])).name}: ${(lootBoxOdds.chance[i] * 100).toFixed(2)}% (${(await abbrevBalance(lootBoxOdds.numericChance[i] / numGCD)).displayValue} / ${(await (abbrevBalance(lootBoxOdds.totalChance / numGCD))).displayValue})`;
        }

        // Send the chances
        await replyContainer(
            interaction,
            "LootBox",
            [message],
            "default"
        )
        return;
    }
};