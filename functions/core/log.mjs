import core from "#config/core/core";
import chalk from "chalk"
import { forceShutdown } from "./fatalShutdown.mjs";
import util from "node:util"
import { writeLogFile } from "#preload/core/fileLog";
const { dateOptions } = core;
const DateFormatter = new Intl.DateTimeFormat(undefined, dateOptions)
let infoCount = 0;
let successCount = 0;
let warnCount = 0;
let errorCount = 0;
let eventCount = 0;
let fatalCount = 0;
let fatal = false;
const log = {

    /**
     * Info event
     * @param {String} text 
     */
    info: function (text) {
        console.log(`[INFO] [${DateFormatter.format(Date.now())}] ${text}`);
        infoCount += 1;
    },

    /**
     * Successful event!
     * @param {String} text 
     */
    success: function (text) {

        const messages = [
            `[SUCCESS] [${DateFormatter.format(Date.now())}] ${text}`,
        ]

        for (const message of messages) {
            console.log(chalk.greenBright(message))
            writeLogFile(message)
        }
        successCount += 1;
    },

    /**
     * Log a given event lol
     * @param {String} text 
     */
    event: function (text) {

        const messages = [
            `[EVENT] [${DateFormatter.format(Date.now())}] ${text}`,
        ]

        for (const message of messages) {
            console.log(chalk.blueBright(message))
            writeLogFile(message)
        }
        eventCount += 1;
    },

    /**
     * Warning event
     * @param {String} text 
     */
    warn: function (text) {

        const messages = [
            `[WARN] [${DateFormatter.format(Date.now())}] ${text}`,
        ]

        for (const message of messages) {
            console.log(chalk.yellowBright(message))
            writeLogFile(message)
        }
        warnCount += 1;
    },

    /**
     * Error event
     * @param {String} text 
     * @param {Error} error 
     */
    error: function (text, error) {

        const messages = [
            `[ERROR] [${DateFormatter.format(Date.now())}] ${text}`,
        ]

        for (const message of messages) {
            console.error(chalk.redBright(message))
            writeLogFile(message)
        }

        if (error) {
            console.error(error)

            const formatted = util.inspect(error, {
                depth: null,
                colors: false,
                showHidden: true
            });
            writeLogFile(formatted)
        }
        errorCount += 1;
    },

    /**
     * Fatal event
     * @param {String} text 
     * @param {Error} error 
     * @param {Number} code 
     * @param {Boolean} shutdown 
     */
    fatal: async function (text, error, code = 0x0000, shutdown = false) {

        fatalCount += 1;
        const hexCode = `0x${code.toString(16).toUpperCase().padStart(4, "0")}`;

        const messages = [
            `[FATAL] [${DateFormatter.format(Date.now())}] ${text}`,
            `[FATAL] [${DateFormatter.format(Date.now())}] Code: ${hexCode}`,
            `[FATAL] [${DateFormatter.format(Date.now())}] Info Events: ${infoCount}`,
            `[FATAL] [${DateFormatter.format(Date.now())}] Success Events: ${successCount}`,
            `[FATAL] [${DateFormatter.format(Date.now())}] Warn Events: ${warnCount}`,
            `[FATAL] [${DateFormatter.format(Date.now())}] Error Events: ${errorCount}`,
            `[FATAL] [${DateFormatter.format(Date.now())}] Fatal Events: ${fatalCount}`,
            `[FATAL] [${DateFormatter.format(Date.now())}] General Events: ${eventCount}`,
        ]

        for (const message of messages) {
            console.error(chalk.red(message))
            writeLogFile(message)
        }

        if (error) {
            console.error(error)

            const formatted = util.inspect(error, {
                depth: null,
                colors: false,
                showHidden: true
            });
            writeLogFile(formatted)
        }



        if (shutdown && !fatal) {
            fatal = true
            await forceShutdown(text);
            process.exit(1) // This should never run
        }
    },
}

const getInfo = function () {
    return infoCount
}
const getSuccess = function () {
    return successCount
}
const getWarn = function () {
    return warnCount
}
const getError = function () {
    return errorCount
}
const getEvent = function () {
    return eventCount
}
const getFatal = function () {
    return fatalCount
}

export { log, getInfo, getSuccess, getWarn, getError, getEvent, getFatal };