const { SlashCommandBuilder } = require('discord.js');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { queryAPI } = require('#functions/discord/api/fetch');

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

        const id = interaction.options.getInteger("id");
        const name = interaction.options.getString("name");

        let send = {
            id: id,
            name: name
        }
        if (id === null) {
            send = {
                name: name
            }
        }

        const result = await queryAPI("/currency/update/lootbox", send);

        if (result.error) {
            if (result.status == 400) {
                await replyContainer(
                    interaction,
                    "Lootbox",
                    ["The item in question is not a lootbox."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return null;
            }
            if (result.status == 404) {
                await replyContainer(
                    interaction,
                    "Lootbox",
                    ["The item does not exist."],
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
                ["Could not query lootbox odds.."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        const lootBoxOdds = result.content

        const gcd = function (a, b) {
            if (b == 0) {
                return a;
            }
            return gcd(b, a % b);
        };

        let message = `Chances of ${lootBoxOdds.name}:`

        for (let i = 0; i < lootBoxOdds.chance.length; i++) {
            let numGCD = gcd(lootBoxOdds.numericChance[i], lootBoxOdds.totalChance);
            message += `\n- ${lootBoxOdds.qty[i]}x ${lootBoxOdds.names[i]}: ${(lootBoxOdds.chance[i] * 100).toFixed(2)}% (${(abbrevBalance(lootBoxOdds.numericChance[i] / numGCD)).displayValue} / ${((abbrevBalance(lootBoxOdds.totalChance / numGCD))).displayValue})`;
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