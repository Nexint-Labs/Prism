/*
View Notifications
This file helps you view Discord notifications
Version ID: 3.0
*/

const { SlashCommandBuilder } = require('discord.js');
const { pageMenu } = require('#functions/v2/discord/menus/pagination');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { listUnreadNotifs, listAllNotifs } = require('#functions/v2/notify/listNotifs');
const { warning } = require('#config/visual/botAssets');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { loadAnim } = require('#functions/v2/helpers/load');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('view-notif')
        .setDescription('View your notifications!')
        .addStringOption(option =>
            option
                .setName("notifs")
                .setDescription("What notifications to view?")
                .setRequired(true)
                .addChoices(
                    { name: "Unread Notifications", value: "unread" },
                    { name: "All Notifications", value: "all" },
                )
        )
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {
        const notifs = interaction.options.getString("notifs", true);

        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        // Check Blacklist (see if you are blacklisted)
        // This piece of code makes sure you're not blacklisted.
        if (await checkBlacklist(interaction)) {
            return;
        }
        
        await loadAnim(interaction, [
            "Fetching Notifications...",
        ], true)

        // Add to analytics
        addCommandsUsed(interaction.user);

        // Get the notifications
        const fetchNotifs = async () => {
            let result;
            switch (notifs) {
                case "unread":
                    result = await listUnreadNotifs(interaction, true);
                    break;
                case "all":
                    result = await listAllNotifs(interaction, true);
                    break;
                default:
                    console.log("Oops! This shouldn't happen lol")
            }

            if (result.error) return null;

            return result.notifs.map(notif => ({
                title: notif.title,
                desc: "Select this item to read the notification.",
                content: notif.content,
                type: notif.type,
                value: "carry"
            }));
        };

        const items = await fetchNotifs();

        if (!items) {
            await replyContainer(
                interaction,
                "Notifications",
                ["This Discord bot is not connected to the Nexint API.","Notifications are not available."],
                "warn",
                warning,
                { checkNotif: false, advert: false }
            )
            returnl
        }

        await pageMenu(
            interaction,
            response,
            notifs === "unread"
                ? "Unread Notifications:"
                : "All Notifications:",
            items,
            null,
            fetchNotifs
        );
    }
};