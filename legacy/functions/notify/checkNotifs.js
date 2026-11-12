const { devNotify, userNotify, botNotify, notifyDB } = require("#preload/dbs/notif");
const { embed } = require("#functions/general/embed");
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { listUnreadNotifs } = require("#functions/notify/notifs");
const { notify } = require("#preload/dbs/funDBs");

const followUpNotif = async function (interaction) {
    if (Math.random() >= 0.1) return;
    const optedOut = await notify.findOne({
        where: { userId: interaction.user.id }
    });

    if (optedOut) return;
    let unreadNotifs = await listUnreadNotifs(interaction, false);
    if (unreadNotifs.error) {
        return
    }
    if (unreadNotifs.notifs.length == 0) {
        return;
    }
    let desc = "";
    desc += `You have ${unreadNotifs.notifs.length} notifications unread!`
    desc += "\n\nRun /view-notif to view your notifications."
    let msg = await embed("Unread Notifications", desc, null, null)
    let options = {
        embeds: [msg],
        components: [],
        withResponse: true,
        withReply: true,
        flags: MessageFlags.Ephemeral
    };
    if (interaction.replied || interaction.deferred) {
        return await interaction.followUp(options);
    }
}

module.exports = {
    followUpNotif
}