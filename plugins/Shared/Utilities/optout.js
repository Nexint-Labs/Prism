const { SlashCommandBuilder } = require('discord.js');
const { optOutCurrency } = require('#functions/v2/currency/administration/cleanup');
const { optOutAction } = require('#functions/v2/actions/actionCmds');
const { optOutUsageData } = require('#functions/v2/analytics/usageData');
const { confirm } = require('#functions/v2/discord/menus/confirm');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { createContainer } = require('#functions/v2/discord/container');
const { loadAnim } = require('#functions/v2/helpers/load');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { warning } = require('#config/visual/botAssets');
const { optOut } = require('#preload/dbs/databases');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('data-opt-out')
        .setDescription('Opt out from data collection. Disables certain features and anonymizes all future data.'),
    async execute(interaction) {

        // defer replies
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        await loadAnim(interaction, [
            "Checking status...",
        ], true)

        if (await optOutChkSingle(interaction.user)) {
            replyContainer(
                interaction,
                "Opt Out",
                ["You are already opted out. This command does not work."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // confirm / cancel row
        const prompt = await createContainer(
            "Opt Out",
            ["Are you sure you want to opt out? This command resets your entire currency profile on all servers."],
            "default",
            null,
            {
                copyright: false,
                checkNotif: false,
                advert: false
            }
        )

        const { decision } = await confirm(
            interaction,
            response,
            prompt
        )

        if (decision === "cancel") {

            await replyContainer(
                interaction,
                "Opt Out",
                ["✅ Opt out cancelled."],
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
                "Opt Out",
                ["Confirmation not received within 30 seconds, cancelling."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;

        }

        try {

            // opt out action commands
            let optOutValue = await optOutAction(interaction);
            if (optOutValue == false) {
                await replyContainer(
                    interaction,
                    "Opt Out",
                    ["Something went wrong while trying to opt out actions."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return;
            }

            // opt out currency
            optOutValue = await optOutCurrency(interaction);
            if (optOutValue == false) {
                await replyContainer(
                    interaction,
                    "Opt Out",
                    ["Something went wrong while trying to opt out currency."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return;
            }
            // opt out usage data
            optOutValue = await optOutUsageData(interaction);
            if (optOutValue == false) {
                await replyContainer(
                    interaction,
                    "Opt Out",
                    ["Something went wrong while trying to opt out usage data."],
                    "warn",
                    warning,
                    {
                        advert: false
                    }
                )
                return;
            }

            await optOut.create({
                author: interaction.user.id,
            });
            await replyContainer(
                interaction,
                "Opt Out",
                [
                    "✅ You have been opted out successfully.",
                    "Please note that your UID will be stored to prevent further data collection."
                ],
                "default",
                null,
                {
                    advert: false
                }
            )
            // console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${interaction.user.id} has opted out.`);
        }
        catch (error) {
            throw error;
        }



    },
};