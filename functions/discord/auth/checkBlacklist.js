let blacklist = null;
let date = Math.floor(Date.now() / 1000);
const { apiServer, delay, apiName } = require('#config/discord/api/NexAPI');
const { devName } = require('#config/core/core');
const { warning } = require('#config/discord/visual/botAssets');
const { getAPI } = require('#functions/discord/api/fetch');
const { replyContainer } = require('#functions/discord/container/replyContainer');

/**
 * Are you blacklisted?
 * @param {String} id 
 * @returns 
 */
const isBlacklisted = async function (id) {
    const activeServer = apiServer;

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
        if (blacklist[i].userid == id) {
            return true;
        }
    }
    return false;
}

/**
 * Check blacklist real
 * @param {import('discord.js').Interaction} interaction 
 * @returns 
 */
const checkBlacklist = async function (interaction) {
    if (await isBlacklisted(interaction.user.id)) {
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