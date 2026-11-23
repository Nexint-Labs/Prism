// Small small bootstrap loader.
// If loading this goes wrong, you probably dont even have Node installed lol
const fs = require("node:fs");

/**
 * Safe writer
 * Writes to stdout or stderr.
 * @param {String} text
 * @param {Number} [fd=1] File descriptor (1 = stdout, 2 = stderr).
 */
function safeWrite(text, fd = 1) {
    try {
        fs.writeSync(fd, `${text}\n`);
    } catch {
        // Output is unavailable. Silently continue.
    }
}

/**
 * Default local time lol
 */
function timestamp() {
    return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    });
}

/**
 * Small logger that doesn't import external dependencies
 * (allegedly)
 */
const log = {
    event(text) {
        safeWrite(`\x1b[94m[EVENT] [${timestamp()}] ${text}\x1b[0m`);
    },

    error(text, error) {
        safeWrite(`\x1b[91m[ERROR] [${timestamp()}] ${text}\x1b[0m`, 2);

        if (error) {
            try {
                safeWrite(error.stack || String(error), 2);
            } catch {
                safeWrite(`\x1b[91m[ERROR] [${timestamp()}] Unable to format error.\x1b[0m`, 2);
            }
        }
    }
};

/**
 * Bootstrapper that loads the files
 * :sob:
 */
try {
    log.event("Starting...")
    const index = require("./boot.js");
    module.exports = index
} catch (error) {
    log.error("Loading failed.", error)
    log.error("Check configuration deps and startup code.")
    log.error("Code: 0x0000.")
    process.exit(1)
}