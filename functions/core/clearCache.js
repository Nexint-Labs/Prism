const { verbose } = require("#config/core/core");
const path = require("node:path");
const { log } = require("./log.mjs");

const clearPrismCache = function () {
    const directories = ["apps", "plugins", "console", "functions", "config"];
    let cleared = 0;

    for (const filename of Object.keys(require.cache)) {
        const relative = path.relative(process.cwd(), filename);

        if (directories.some(dir => relative.startsWith(dir + path.sep))) {
            delete require.cache[filename];
            if (verbose) {
                log.info(`Deleted cache for ${filename}`)
            }
            cleared += 1;
        }
    }
    return cleared;
}

const clearFunctions = function () {
    const directories = ["functions", "config"];
    let cleared = 0;

    for (const filename of Object.keys(require.cache)) {
        const relative = path.relative(process.cwd(), filename);

        if (directories.some(dir => relative.startsWith(dir + path.sep))) {
            delete require.cache[filename];
            if (verbose) {
                log.info(`Deleted cache for ${filename}`)
            }
            cleared += 1;
        }
    }
    return cleared;
}

module.exports = {
    clearPrismCache,
    clearFunctions
}