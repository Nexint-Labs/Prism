console.log("Importing logging. If this goes wrong, you're cooked.")

// Import the .env lol
const env = require('dotenv').config({ path: __dirname + '/.env' });
const { logFormat } = require('#config/core/log');
if (!process.env.PRISM_LOG_FORMAT) {
    process.env.PRISM_LOG_FORMAT = logFormat
}
const { log } = require('#functions/core/log.mjs');

log.event("Loading configs... If this bot stops here, something went seriously wrong!")

// Load configs (that actually matter)
const { frameVer, autoUpdate, frameName, errorPolicy } = require('#config/core/core');
const { load, loadConsole } = require('#functions/core/load');
const delay = require("#functions/core/delay");

// Other cool stuff :)
const { date } = require('#functions/core/date');
const { updateCheck } = require('#functions/core/update');
const { gracefulShutdown } = require('#functions/core/powerCycle');

// Prepare the console
const readline = require('node:readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

// Start loading
const startLoad = Date.now();

// Is the console open?
let consoleOpen = true;

// Export the app and wss
module.exports = {
    consoleOpen,
    startLoad,
    readline: rl,
    sourceDir: __dirname,
}

// Process.on random unhandled stuff
process.on('uncaughtException', async (error, origin) => {
    try {
        if (errorPolicy.uncaughtException === "warn") {
            log.error("An uncaught exception has happened", error)
            log.error(origin)
            return;
        }
        if (errorPolicy.uncaughtException !== "continue") {
            log.error(origin)
            await log.fatal("An uncaught exception has happened.", error, 0x0000, true);
            process.exit(1); // this shouldnt run but i have it
        }
    } catch {
        process.exit(2); // this shouldnt run but i have it
    }
});
process.on("unhandledRejection", async (error, origin) => {
    try {
        if (errorPolicy.unhandledRejection === "warn") {
            log.error("An uncaught promised rejection has happened", error)
            log.error(origin)
            return;
        }
        if (errorPolicy.unhandledRejection !== "continue") {
            log.error(origin)
            await log.fatal("An uncaught promised rejection has happened.", error, 0x0000, true);
            process.exit(1); // this shouldnt run but i have it
        }
    } catch {
        process.exit(2); // this shouldnt run but i have it
    }
})

const init = async function () {

    log.event("Starting...")
    if (env.error) {
        await log.fatal("No .env file exists. Please make it!", env.error, 0x0000, true);
        process.exit(1); // this shouldnt run but i have it
    };

    // Set the directory
    try {
        process.chdir(__dirname);
    } catch (error) {
        await log.fatal("Could not set the directory.", error, 0x0000, true);
        process.exit(1); // this shouldnt run but i have it
    };

    // Make sure directories exist lol
    const fs = require('node:fs');
    const path = require('path');
    const dirs = ["plugins", "preload", "console", "databases", "apps"];
    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            log.info(`Creating directory: ${dir}`);
            fs.mkdirSync(path.join(__dirname, dir));
        };
    });

    // Windows specific patch im ticked off bro
    // Screw you microsoft :sob:
    if (process.platform === "win32") {
        rl.on("SIGINT", function () {
            process.emit("SIGINT");
        });
    }

    // Sigint / Sigterm (real)
    process.on('SIGINT', async () => {
        await gracefulShutdown("Ctrl-C", true)
    })
    process.on('SIGTERM', async () => {
        await gracefulShutdown("OS Termination", true)
    })

    main().catch(async error => {
        await log.fatal("Prism failed to initialize files.", error, 0x0001, true);
    });
}

/**
 * Main function
 * This is the main function that runs the entire backend.
 * what am i doing bro :sob:
 */
const main = async () => {

    log.event("Loading files...")

    // Load preload and plugins
    await load("preload");
    await load("plugins");

    // Load the apps (FINALLY?)
    // This makes my API super modular :)
    await load("apps");

    log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
    log.info(`                 Welcome to ${frameName}!                 `);
    log.info(`             You're running version: ${frameVer}             `);
    log.info("        Stay up to date for the best features.        ");
    log.info('\x1b[36m----------------------------------------------------\x1b[0m');
    log.success(`Done in ${(Date.now() - startLoad) / 1000} seconds!`)
    console.log("Bot is running.")

    await updateCheck(true)

    // real?
    await asyncFunctions();
}

init().catch(async error => {
    await log.fatal("Prism failed to start initializing.", error, 0x0000, true);
});

/**
 * Async Functions
 * These functions are deliberately async'd
 */
const asyncFunctions = async function () {
    commandParser();
    if (autoUpdate) {
        autoUpdateCheck();
    } else {
        log.info("Automatic update checking disabled.")
    }
}

/**
 * Command Parser
 * Parses commands
 */
const commandParser = async () => {
    while (consoleOpen) {
        const command = await prompt('');

        // Is this command valid?
        if (!(await loadConsole("console", command))) {
            log.info("This command is not valid.")
        }
    }
}

// Update checks - Asyncronously checks updates.
const autoUpdateCheck = async () => {
    while (consoleOpen) {
        await delay(3600000); // artificial delay to ensure host's CPU doesn't die
        updateCheck(false);
    }
}