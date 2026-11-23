const { log } = require("./log.mjs");

const { frameVer, autoUpdate, frameID, updateURL, frameName, errorPolicy, updateSource } = require('#config/core/core');

/**
 * Gets the latest version of this bot!
 * @returns 
 */
const getUpdateVersion = async function () {
    try {
        const update = await fetch(updateSource + "/ver.txt");
        if (!update.ok) {
            throw new Error(`HTTP ${update.status}: ${update.statusText}`);
        }
        const updateName = await fetch(updateSource + "/verName.txt");
        if (!update.ok) {
            throw new Error(`HTTP ${update.status}: ${update.statusText}`);
        }
        const tmp = await update.text();
        const version = Number(tmp)
        const result = await updateName.text();
        const versionName = result
        if (!Number.isNaN(version)) {
            return [versionName, version]
        } else {
            throw new Error("Not a Number.")
        }
    } catch (error) {
        log.error("An error happened while trying to check for updates!")
        log.error("Likely caused by the bot being unable to access Github. Full stack trace:", error)
        return 0;
    }
};


/**
 * Update Checker
 * If it's the initial check, it notifies even if it's the latest version.
 * If not, it does not notify.
 * @param {Boolean} initial 
 */
const updateCheck = async function (initial) {
    const check = await getUpdateVersion();
    if (!check) {
        log.error("Something went wrong updating Prism!")
        return;
    }
    const [versionName, latestVersion] = check

    if (frameID < latestVersion) {
        log.warn(`You're running an outdated version of ${frameName}! (You are ${latestVersion - frameID} commits behind)`)
        log.warn(`Update now at ${updateURL} to make sure that ${frameName} has the latest security fixes!`)
        if ((latestVersion - frameID) >= 5) {
            log.warn(`You are over 5 commits behind. Update to the latest version as soon as possible.`)
        }
        log.warn(`Current version: v${frameVer} / Latest Version: ${versionName}`)
    } else if (latestVersion <= 0) {
        log.warn("This instance of Prism cannot reliably connect to the internet.")
    } else if (frameID > latestVersion) {
        log.warn(`You're running an experimental version of ${frameName}! (You are ${frameID - latestVersion} commits ahead)`)
        log.warn(`Here be dragons!~`)
        log.warn(`Current version: v${frameVer} / Latest Version: ${versionName}`)
    } else if (initial) {
        log.info(`You're running the latest version of ${frameName}!`)
    }
}

module.exports = {
    getUpdateVersion,
    updateCheck
}