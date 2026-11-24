const { verbose } = require("#config/core/core");
const path = require("node:path");
const { log } = require("./log.mjs");

/**
 * clear directory lol
 * @param {String} dir 
 * @returns 
 */
const clearDirectory = function (dir) {
    let cleared = 0;

    for (const filename of Object.keys(require.cache)) {
        const relative = path.relative(process.cwd(), filename);

        if (relative.startsWith(dir + path.sep)) {
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
    clearDirectory
}