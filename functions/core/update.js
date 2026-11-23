const { updateSource, updateURL } = require("#config/core/core");
const { log } = require("./log.mjs");

/**
 * Gets the latest version of this bot!
 * @returns 
 */
const getUpdateVersion = async function () {
    try {
        const update = await fetch(updateSource);
        if (!update.ok) {
            throw new Error(`HTTP ${update.status}: ${update.statusText}`);
        }
        const tmp = await update.text();
        const version = Number(tmp)
        if (!Number.isNaN(version)) {
            return version
        } else {
            throw new Error("Not a Number.")
        }
    } catch (error) {
        log.error("An error happened while trying to check for updates!")
        log.error("Likely caused by the bot being unable to access Github. Full stack trace:", error)
        return 0;
    }
};

module.exports = {
    getUpdateVersion
}