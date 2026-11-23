const { logDir } = require("#config/core/log");
const fs = require("node:fs");
const path = require("node:path");
const { log, forceShutdown } = require("../../functions/core/fatalShutdown.mjs");
const { frameName } = require("#config/core/core");

let logFormat = process.env.PRISM_LOG_FORMAT;


let outputFileStream = {
    /**
     * Deliberately returns null to prevent program crashing if the output file stream does not exist.
     * Note for future self: Do not export the original file stream. Export other stuff.
     * @param {String} text 
     * @returns 
     */
    write: function (text) {
        return null;
    }
}
/**
 * Load the initial logger.
 */
const loadLogFile = async function () {
    if (outputFileStream instanceof fs.WriteStream && !outputFileStream.destroyed) {
        return;
    }
    const dirs = [logDir];
    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            log.info(`Creating directory: ${dir}`);
            fs.mkdirSync(path.join(process.cwd(), dir));
        };
    });
    outputFileStream = fs.createWriteStream(path.join(process.cwd(), logDir, `${logFormat}.txt`), { 'flags': 'a' });

    await new Promise((resolve, reject) => {
        const onOpen = () => {
            outputFileStream.off("error", onError);
            resolve();
        };

        const onError = (err) => {
            outputFileStream.off("open", onOpen);
            reject(err);
        };

        outputFileStream.once("open", onOpen);
        outputFileStream.once("error", onError);
    });

    outputFileStream.on("error", (err) => {
        log.error("File logging failed:", err);
        forceShutdown(`File Logging failed, ${frameName} is in an unstable state.`)
    });
    if (!process.send) {
        outputFileStream.write(`-----------------Info-------------------\n`);
        outputFileStream.write(`|  These logs are for debug purposes.  |\n`);
        outputFileStream.write(`|    Logging is optional with args.    |\n`);
        outputFileStream.write(`|    Logs are turned on by default.    |\n`);
        outputFileStream.write(`----------------------------------------\n`);
    }
}

/**
 * Log to a file
 * @param {String} text 
 */
const writeLogFile = async function (text) {
    outputFileStream.write(`${text}\n`);
}

module.exports = {
    writeLogFile,
    async execute() {
        await loadLogFile()
    },

    /**
     * Closes the loader lol
     * @returns 
     */
    async close() {
        if (!(outputFileStream instanceof fs.WriteStream)) {
            return;
        }

        const stream = outputFileStream;

        if (stream.writableFinished || stream.writableEnded || stream.destroyed) {
            outputFileStream = {
                write() {
                    return null;
                }
            };
            return;
        }

        await new Promise((resolve, reject) => {
            const onError = (err) => {
                stream.off("finish", onFinish);
                reject(err);
            };

            const onFinish = () => {
                stream.off("error", onError);
                resolve();
            };

            stream.once("error", onError);
            stream.once("finish", onFinish);
            stream.end();
        });

        outputFileStream = {
            write() {
                return null;
            }
        };
    }
}