const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { listUnreadNotifs } = require("#functions/v2/notify/listNotifs");
const { notify } = require("#preload/dbs/funDBs");
const { followUpContainer } = require("#functions/v2/discord/followUpContainer");
const { pfp } = require("#config/visual/botAssets");
const { notifChance } = require("#config/api/NexAPI");
const { optOut } = require('#preload/dbs/databases');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');

/**
 * Creates a follow up notification
 * @param {import("discord.js").Interaction} interaction 
 * @returns {String}
 */
const followUpNotif = async function (interaction) {

    if (Math.random() >= notifChance) return;

    const notifOptedOut = await notify.findOne({
        where: { userId: interaction.user.id }
    });

    if (notifOptedOut) return;

    if (await optOutChkSingle(interaction.user)){
        return
    }
    
    let unreadNotifs = await listUnreadNotifs(interaction, false);
    if (unreadNotifs.error) {
        return
    }
    if (unreadNotifs.notifs.length == 0) {
        return;
    }
    let notifDesc = "";
    notifDesc += `You have ${unreadNotifs.notifs.length} notifications unread!`
    notifDesc += "\n\nRun /view-notif to view your notifications."
    await followUpContainer(interaction, "Unread Notifications", [notifDesc], "default", pfp, {ephemeral: true, checkNotif: false, copyright: false, advert: false})
    return notifDesc;
}

module.exports = {
    followUpNotif
}