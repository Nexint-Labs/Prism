let blacklist = null;
let date = Math.floor(Date.now() / 1000);
const { apiServer, delay, apiName } = require('#config/api/NexAPI');
const { devName } = require('#config/core/core');
const { warning } = require('#config/visual/botAssets');
const { getAPI } = require('#functions/v2/api/fetch');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

const isBlacklisted = async function (id, serverParam) {
    const activeServer = serverParam || server;



    if ((blacklist === null || Math.floor(Date.now() / 1000) > Number(date) + delay) && (activeServer != null && activeServer != "")) {

        // Connect to my advertisement API
        const connect = await getAPI("/blacklist");
        if (!connect.error) {
            blacklist = connect.content.blacklist;
            date = Math.floor(Date.now() / 1000);
        }
    }

    if (blacklist === null) {
        return false;
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
    if (await isBlacklisted(interaction.user.id, apiServer)) {
        await replyContainer(
            interaction,
            "Warning",
            [
                `You have been blacklisted from the ${apiName}.\n\nYou may not use any ${devName} hosted services.`,
                `Contact ${devName} for assistance.`,
            ],
            "default",
            warning,
            {
                ephemeral: true,
                checkNotif: false,
                advert: false,
            }
        )
        return true;
    }
    return false;
}

module.exports = {
    isBlacklisted,
    checkBlacklist,
};