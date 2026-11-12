const { server, delay, header } = require('#app-config')
let blacklist = [];
let date = Math.floor(Date.now() / 1000);
const { replyEmbed } = require('#functions/general/replyEmbed');

const isBlacklisted = async function (id, serverParam) {
    const activeServer = serverParam || server;
    if ((blacklist.length == 0 || Math.floor(Date.now() / 1000) > Number(date) + delay) && (activeServer != null && activeServer != "")) {
        try {
            const update = await fetch(activeServer + '/api/v1/blacklist', {
                method: 'GET',
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const event = await update.json();
            blacklist = event.content.blacklist;
            date = Math.floor(Date.now() / 1000);
        } catch {
            if (blacklist == undefined) {
                blacklist = [];
            }
            console.log("[" + Date.now() + `] [ERROR] Could not hit the Nexint API.`);
            console.log("[" + Date.now() + `] [INFO] Relying on old data. Will get data next time.`);
        }
    }

    for (let i = 0; i < blacklist.length; i++) {
        if (blacklist[i] == id) {
            return true;
        }
    }
    return false;
}

/*
Checks if a user is blacklisted.
Pre: interaction
Post: true if blacklisted, false if not blacklisted
*/
const checkBlacklist = async function (interaction) {
    if (await isBlacklisted(interaction.user.id, server)) {
        await replyEmbed(interaction, "Warning", "You have been blacklisted from all Nexint services.")
        return true;
    }
    return false;
}

module.exports = {
    isBlacklisted,
    checkBlacklist,
};