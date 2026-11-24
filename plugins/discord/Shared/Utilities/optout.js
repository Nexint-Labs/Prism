const { SlashCommandBuilder } = require('discord.js');
const { confirm } = require('#functions/discord/container/menus/confirm');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { createContainer } = require('#functions/discord/container/container');
const { loadAnim } = require('#functions/discord/helpers/load');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { warning } = require('#config/discord/visual/botAssets');
const { postAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');

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
            const optedOut = await postAPI("/opt-out", {
                userId: interaction.user.id,
                name: getUsername(interaction.user)
            })
            if (optedOut.error) {
                await replyContainer(
                    interaction,
                    "Opt In",
                    ["Opt out has failed. Please try opting out again!",],
                    "warn",
                    warning,
                    { advert: false, }
                )
                return
            }
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
        }
        catch (error) {
            throw error;
        }



    },
};