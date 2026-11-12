const { postAPI } = require("#functions/v2/api/fetch");

/**
 * List Unread Notifications
 * Connects to the Nexint API
 * @param {import("discord.js").Interaction} interaction 
 * @param {Boolean} refresh 
 * @returns 
 */
const listUnreadNotifs = async function (interaction, refresh) {
    const notifAPI = await postAPI("/notifs/listUnread", {
        userId: interaction.user.id,
        refresh: refresh
    })
    return notifAPI
}


/**
 * List All Notifications
 * Connects to the Nexint API
 * @param {import("discord.js").Interaction} interaction 
 * @param {Boolean} refresh 
 * @returns 
 */
const listAllNotifs = async function (interaction, refresh) {
    const notifAPI = await postAPI("/notifs/listAll", {
        userId: interaction.user.id,
        refresh: refresh
    })
    return notifAPI
}

/**
 * Adds a notification by contacting the Nexint API.
 * @param {String} title 
 * @param {String} content 
 * @param {String} type 
 * @returns 
 */
const addNotifs = async function (title, content, type) {
    const addNotifAPI = await postAPI("/notifs/addNotifs", {
        title: title,
        content: content,
        type: type
    })
    return addNotifAPI;
}

module.exports = {
    listUnreadNotifs,
    listAllNotifs,
    addNotifs,
}