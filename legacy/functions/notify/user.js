const { devNotify, userNotify, botNotify, notifyDB } = require("#preload/dbs/notif");
const { postAPI } = require("#functions/api/fetch")

/*
findOrAddNotifyUser
Finds a pre-existing user.
Pre: interaction
Post: user
*/
const findOrAddNotifyUser = async function (interaction) {
    const user = await postAPI(null, "/notifs/query", {
        userId: interaction.user.id
    }) // thankfully this works bro
    return user;
    try {
        const [user, created] = await notifyDB.transaction(async (t) => {
            return await userNotify.findOrCreate({
                where: { userId: interaction.user.id },
                defaults: {
                    userId: interaction.user.id, // user id
                    date: 0, // 0
                },
                transaction: t // optional transaction instance
            });
        });

        if (created) {
            console.log('New user created within transaction:', user.id);
        } else {
            console.log('Existing user retrieved:', user.id);
        }
        return user;
    } catch (error) {
        console.error('Transaction failed and was rolled back:', error);
        return undefined;
    }
}

/*
Refresh User
Refreshes the users "last viewed notifications"
Pre: interaction
Post: user
*/
const refreshUser = async function (interaction) {
    const rows = await postAPI(null, "/notifs/refresh", {
        userId: interaction.user.id
    }) // thankfully this works bro
    return rows;
    try {
        const rowsChanged = await notifyDB.transaction(async (t) => {
            return await userNotify.update(
                { date: Date.now() },
                {
                    where: { userId: interaction.user.id },
                    transaction: t
                }
            );
        });
        return rowsChanged;
    } catch (error) {
        console.error('Transaction failed and was rolled back:', error);
        return undefined;
    }
}

module.exports = {
    findOrAddNotifyUser,
    refreshUser,
}