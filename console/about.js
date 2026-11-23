const { frameName, frameVer, frameID } = require('#config/core/core');
const { pluginName, pluginVer } = require('#config/cosmetic/config');
const { date } = require('#functions/core/date');
const { log, getInfo, getSuccess, getWarn, getError, getFatal, getEvent } = require('#functions/core/log.mjs');
const { getUpdateVersion } = require('#functions/core/update');

module.exports = {
    // Example of a help menu given by the bot.
    // Input: none
    // Expected Return: An array of strings.
    help() {
        return [
            'Developer:',
            '/print (args) - Prints stuff to the console!',
            'By default, /print prints what possible arguments there are.',
        ];
    },
    // Example of a command in the CLI (command line) of the bot.
    // Input: command given by the bot, readline function, client
    // Expected Return: true or false depending on if the command was valid or not. Otherwise, this breaks the code used to determine if a command is valid or not.
    async command(command) {
        switch (command.split(" ")[0].toLowerCase()) {
            case "/print": // Prints various things. This mostly serves as a developer command.
                let print;
                if (command.split(" ")[1] != undefined) {
                    print = command.split(" ")[1].toLowerCase();
                }
                switch (print) {
                    case "v":
                    case 'version':
                        log.info(`\x1b[36m------------------- Version Info -------------------\x1b[0m`)
                        let latestVersion = await getUpdateVersion();
                        log.info("Printing the version...")
                        log.info(`${pluginName} Version: ${pluginVer}`)
                        log.info(`${frameName} Version: ${frameVer} (Version ID: ${frameID}) / Latest version ID: ${latestVersion}.`)
                        if (latestVersion > frameID) {
                            log.info(`${latestVersion - frameID} commits behind.`)
                        } else if (latestVersion == 0) {
                            log.warn(`Updates may or may not be working.`)
                        } else if (latestVersion < frameID) {
                            log.info(`${frameID - latestVersion} commits ahead.`)
                        } else {
                            log.info(`Running the latest version.`)
                        }
                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;
                    case "b":
                    case 'build':
                        log.info(`\x1b[36m-------------------- Build Info --------------------\x1b[0m`)
                        log.info(`Printing the build!`)
                        log.info(`${pluginName} v${pluginVer}`)
                        log.info(`${frameName} v${frameVer}`)
                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;
                    case 'l':
                    case 'logs':
                        log.info(`\x1b[36m--------------------- Log Info ---------------------\x1b[0m`)
                        log.info(`${getInfo() + getSuccess() + getWarn() + getError() + getFatal() + getEvent()} total events.`)
                        log.info(`${getInfo() - 1} info events.`)
                        log.info(`${getSuccess()} successful events.`)
                        log.info(`${getWarn()} warning events.`)
                        log.info(`${getError()} error events.`)
                        log.info(`${getFatal()} fatal events.`)
                        log.info(`${getEvent()} general events.`)
                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                        break;
                    default:
                        log.info(`Not a valid argument.`)
                        log.info(`Valid arguments:`)
                        log.info(`version - Prints version info`)
                        log.info(`build - Prints ${frameName} build`)
                        log.info(`logs - Prints the log events.`)
                        log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                }
                return true;
            default:
                return false;
        }
    }
}