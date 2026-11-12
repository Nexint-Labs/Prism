const { devNotify, userNotify, botNotify, notifyDB } = require("#preload/dbs/notif");
const { postAPI } = require("#functions/api/fetch");
const { findOrAddNotifyUser, refreshUser } = require("#functions/notify/user");

/*
List Notifications
List the notifications the user has not read.
*/
const listUnreadNotifs = async function (interaction, refresh) {
    const notifAPI = await postAPI(null, "/notifs/listUnread", {
        userId: interaction.user.id,
        refresh: refresh
    })
    return notifAPI
    // Notify DB
    let notifs = [];
    let user = await findOrAddNotifyUser(interaction);

    // List the notifications
    const devNotifs = await devNotify.findAll({
        order: [
            ['date', 'DESC'],
        ],
    });
    const botNotifs = await botNotify.findAll({
        order: [
            ['date', 'DESC'],
        ],
    });

    // Build the notifications array
    for (let i = 0; i < devNotifs.length; i++) {
        if (user.date < devNotifs[i].date) {
            notifs.push(devNotifs[i]);
        }
    }
    for (let i = 0; i < botNotifs.length; i++) {
        if (user.date < botNotifs[i].date) {
            notifs.push(botNotifs[i]);
        }
    }

    if (refresh) {
        // Refresh the user (You have read notifications)
        await refreshUser(interaction);
    }

    // Build the return window
    return {
        notifs,
        user
    }
}

const listAllNotifs = async function (interaction, refresh) {
    const notifAPI = await postAPI(null, "/notifs/listAll", {
        userId: interaction.user.id,
        refresh: refresh
    })
    return notifAPI
}

/*
Add Notifs
Add a notification with transaction T
Will be re-factored to implement Nexint API soon
*/
const addNotifs = async function (title, content, type) {
    const addNotifAPI = await postAPI(null, "/notifs/addNotifs", {
        title: title,
        content: content,
        type: type
    })
    return addNotifAPI;
    try {
        const user = await notifyDB.transaction(async (t) => {
            return await devNotify.create({
                title: title,
                content: content,
                type: type,
                date: Date.now(),

            }, { transaction: t }
            );
        });
        console.log('New notification created within transaction:', user.id);
    } catch (error) {
        console.error('Transaction failed and was rolled back:', error);
    }
}

module.exports = {
    listUnreadNotifs,
    listAllNotifs,
    addNotifs,
}