const fs = require("node:fs");
const path = require('path');
const { log } = require("./log.mjs");
const { verbose, errorPolicy } = require("#config/core/core");
const { forceShutdown } = require("./fatalShutdown.mjs");


/**
 * Load files in a specific directory.
 * This runs the execute function.
 * @param {String} dir 
 */
const load = async function (dir) {

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            // Execute the plugin?
            try {
                const plugin = require(path.join(process.cwd(), dir, file));
                if ('execute' in plugin && !('data' in plugin)) { // Discord fix lol
                    await plugin.execute();
                    if (verbose) {
                        log.info(`Loaded file: ${path.join(dir, file)}`)
                    }
                }
            } catch (error) {

                if (errorPolicy.uncaughtException === "continue") {
                    continue;
                } else if (errorPolicy.uncaughtException === "warn") {
                    log.error("Failed to load files.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    continue;
                } else {
                    log.error("Failed to load files.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    await forceShutdown("Failed to load files.")
                }
            }
        }
    }
}

/**
 * Load console files
 * This runs the console function.
 * @param {String} dir 
 * @param {String} command 
 */
const loadConsole = async function (dir, command) {

    let validCommand = false;

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            // Load the console command?
            try {
                const console = require(path.join(process.cwd(), dir, file));
                if ('command' in console) {
                    validCommand = await console.command(command);
                    if (verbose) {
                        log.info(`Loaded file: ${path.join(dir, file)}`)
                    }
                }
                if (validCommand) {
                    return true
                }
            } catch (error) {
                if (errorPolicy.uncaughtException === "continue") {
                    continue;
                } else if (errorPolicy.uncaughtException === "warn") {
                    log.error("Failed to load console files.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    continue;
                } else {
                    log.error("Failed to load console files.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    await forceShutdown("Failed to load console files.")
                }
            }
        }
    }
    return false;
}

/**
 * Load help menu.
 * This is meant to run dynamically.
 * @param {String} dir 
 */
const loadHelp = async function (dir) {

    let helpArray = [];

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            // Load the help menu?
            try {
                const help = require(path.join(process.cwd(), dir, file));
                if ('help' in help) {
                    helpArray = helpArray.concat(await help.help())
                }
            } catch (error) {
                if (errorPolicy.uncaughtException === "continue") {
                    continue;
                } else if (errorPolicy.uncaughtException === "warn") {
                    log.error("Failed to load help menu.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    continue;
                } else {
                    log.error("Failed to load help menu.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    await forceShutdown("Failed to load help menu")
                }
            }
        }
    }
    return helpArray;
}

/**
 * Close everything (shut it all down) safely.
 * @param {String} dir 
 */
const close = async function (dir) {

    let success = true;

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            try {
                // Load the help menu?
                const filename = require.resolve(path.join(process.cwd(), dir, file));
                const cached = require.cache[filename];

                if (!cached || !cached.loaded) {
                    continue;
                }

                const app = cached.exports;
                if ('close' in app) {
                    await app.close()
                    if (verbose) {
                        log.info(`Closed file: ${path.join(dir, file)}`)
                    }
                }
            } catch (error) {
                success = false

                if (errorPolicy.uncaughtException === "continue") {
                    continue;
                } else {
                    log.error("Failed to close app.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                }
            }
        }
    }
    return success;
}

/**
 * Refresh everything
 * @param {String} dir 
 */
const refresh = async function (dir) {

    let success = true;

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    for (const file of files) {

        // Only load JS files (trust)
        if (file.includes(".js")) {

            try {
                // Load the help menu?
                const app = require(path.join(process.cwd(), dir, file));
                if ('reload' in app) {
                    await app.reload()
                    if (verbose) {
                        log.info(`Refreshed file: ${path.join(dir, file)}`)
                    }
                }
            } catch (error) {
                success = false
                if (errorPolicy.uncaughtException === "continue") {
                    continue;
                } else if (errorPolicy.uncaughtException === "warn") {
                    log.error("Failed to refresh app.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    continue;
                } else {
                    log.error("Failed to refresh app.")
                    log.error(`Problematic file: ${path.join(dir, file)}`, error)
                    await forceShutdown("Failed to refresh app.")
                }
            }
        }
    }
    return success;
}

module.exports = {
    load,
    loadConsole,
    loadHelp,
    close,
    refresh
}