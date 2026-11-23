const { clearFunctions, clearPrismCache } = require("./clearCache");
const { date } = require("./date");
const { close, refresh, load } = require("./load");
const { log } = require("./log.mjs");

let shutDownState = null;
let otherState = null;

/**
 * Graceful Shutdown of bot
 * Exit: Determines if the process exits immediately or not.
 * @param {String} cause 
 * @param {Boolean} exit 
 */
const gracefulShutdown = async function (cause, exit) {
    if (shutDownState) {
        await log.fatal(`Additional shutdown requested during active shutdown. Escalating to forced shutdown. Cause: ${cause}`, null, 0x0004, true);
        process.exit(1) // again, this shouldnt happen in any circumstance, but just a failsafe :)
    }
    if (otherState) {
        log.error(`This app is in an undefined state. Shutting down to avoid conflicts.`)
        await log.fatal(`Shutdown triggered while another power operation was happening. Cause: ${cause}`, null, 0x0004, true);
        process.exit(1) // again, this shouldnt happen in any circumstance, but just a failsafe :)

    }
    shutDownState = true;
    log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    log.event(`Shutdown triggered by: ${cause}`)
    log.event("Closing all apps...")

    try {
        let success = true;
        let dirs = ["apps", "plugins", "preload"];
        for (const dir of dirs) {
            if (!await close(dir)) {
                success = false
            }
        }
        if (!success) {
            log.error("One or more components failed to close.");
        } else {
            log.event("All components closed successfully.");
        }
    } catch (error) {
        log.error("Prism could not be force shut down properly.", error)
        process.exit(1);
    } finally {
        log.event("Shutting down.")
        log.info(`\x1b[36m----------------------------------------------------\x1b[0m`)
        shutDownState = false;
        if (exit) {
            process.exit(0);
        }
    }
}

/**
 * Reloads files
 * @param {String} cause 
 * @returns 
 */
const reload = async function (cause) {

    // State machine
    if (otherState || shutDownState) {
        return;
    }
    otherState = true;
    log.info(`\x1b[36m---------------------- Reload ----------------------\x1b[0m`)
    const startReload = Date.now()
    log.event(`Reload triggered by: ${cause}`)

    // Closes apps and plugins
    let success = true;
    let dirs = ["apps", "plugins"];
    for (const dir of dirs) {
        if (!await close(dir)) {
            success = false
        }
    }

    // Determine if successful
    if (!success) {
        await log.fatal("One or more components failed to close.", null, 0x0003, true);
        process.exit(1) // again, this shouldnt happen in any circumstance, but just a failsafe :)
    } else {
        log.success("Apps have been taken temporarily offline.");
    }
    const cleared = clearPrismCache();
    log.success(`Cleared ${cleared} files!`)

    // Load apps and plugins
    await load("plugins");
    await load("apps");
    log.success(`Reload complete in ${(Date.now() - startReload) / 1000}s!`)
    log.warn("Note: Reloading is unstable and not explicitly supported. If things don't work, restart.")
    log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    otherState = false;
    return;
}

/**
 * Refreshes the Discord part lol
 * @returns 
 */
const refreshCycle = async function (cause) {

    // State machine
    if (otherState || shutDownState) {
        return;
    }
    otherState = true;
    log.info(`\x1b[36m------------------- Refresh real --------------------\x1b[0m`)
    const startRefresh = Date.now()
    log.event(`Refresh triggered by: ${cause}`)

    // Start refreshing
    const cleared = clearFunctions()
    log.success(`Cleared ${cleared} files!`)
    let success = true;
    let dirs = ["apps"];
    for (const dir of dirs) {
        if (!await refresh(dir)) {
            success = false
        }
    }

    // Determine success or not
    if (!success) {
        await log.fatal("One or more components failed to refresh.", null, 0x0004, true);
        process.exit(1) // again, this shouldnt happen in any circumstance, but just a failsafe :)
    } else {
        log.success(`Refresh complete in ${(Date.now() - startRefresh) / 1000}s!`)
    }

    // Cleanup
    log.warn("Note: Refreshing is unstable and not explicitly supported. If things don't work, restart or reload.")
    log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    otherState = false;
    return;
}

module.exports = {
    gracefulShutdown,
    reload,
    refreshCycle
}