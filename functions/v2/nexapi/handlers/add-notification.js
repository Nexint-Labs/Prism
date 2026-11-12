
const { embed } = require('#functions/v2/nexapi/compat');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { checkBlacklist } = require("#functions/v2/auth/checkBlacklist")
const { addNotifs } = require("#functions/v2/notify/listNotifs")
const { devId: devID } = require('#config/core/discord');

// New Embeds



module.exports = {
    async execute(interaction) {

        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (!(interaction.user.id == devID)) {
            let msg = await embed("Notification API", "You are not authorized to use this tool.", null, null);
            await interaction.editReply({
                embeds: [msg], withResponse: true
            });
            return;
        }

        // Check Blacklist (see if you are blacklisted)
        // This piece of code makes sure you're not blacklisted.
        if (await checkBlacklist(interaction)) {
            return;
        }

        // Add to analytics
        addCommandsUsed(interaction.user);

        let title = interaction.options.getString("title");
        let desc = interaction.options.getString("content");
        let type = interaction.options.getString("type");

        await addNotifs(title, desc, type);

        let msg = "Successfully added the notification:\n\n"
        msg += `- Title: ${title}\n`
        msg += `- Desc: ${desc}\n`
        msg += `- Types: ${type}\n`

		// Send reply
        const embeds = await embed("Add Notification", msg, null, null)
        await interaction.editReply({
            embeds: [embeds]
        });
        return;
    }
};
