
const { followUpContainer } = require("#functions/discord/container/followUpContainer");
const { pfp } = require("#config/discord/visual/botAssets");
const { notifChance } = require("#config/discord/api/NexAPI");
const { queryAPI } = require("../api/fetch");
const { listUnreadNotifs } = require("./listNotifs");

/**
 * Creates a follow up notification
 * @param {import("discord.js").Interaction} interaction 
 * @returns {String}
 */
const followUpNotif = async function (interaction) {

    //if (Math.random() >= notifChance) return;

    const notifs = await listUnreadNotifs(interaction, false)

    if (notifs.error) {
        return
    }
    if (notifs.content.length == 0) {
        return;
    }
    let notifDesc = "";
    notifDesc += `You have ${notifs.content.length} notifications unread!`
    notifDesc += "\n\nRun /view-notifs to view your notifications."
    await followUpContainer(interaction, "Unread Notifications", [notifDesc], "default", pfp, {ephemeral: true, checkNotif: false, copyright: false, advert: false})
    return notifDesc;
}

module.exports = {
    followUpNotif
}