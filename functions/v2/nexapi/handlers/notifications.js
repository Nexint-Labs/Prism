/*
View Notifications
This file helps you view Discord notifications
Version ID: 3.0
*/

const { embed } = require('#functions/v2/nexapi/compat');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { checkBlacklist } = require("#functions/v2/auth/checkBlacklist")
const { listUnreadNotifs } = require("#functions/v2/notify/listNotifs")
const { listAllNotifs } = require("#functions/v2/notify/listNotifs")
const { buildOptionsMenu, buildOptionSelectMenu } = require("#functions/v2/helpers/addRow")
const { handleInteractionError } = require("#functions/v2/helpers/handleInteractionError");
const { replyEmbed } = require('#functions/v2/nexapi/compat');
const { pageMenu } = require('#functions/v2/discord/menus/pagination');


module.exports = {
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
            return replyEmbed(
                interaction,
                "Notifications",
                "This Discord bot is not connected to the Nexint API.\n\nNotifications are not available."
            );
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
