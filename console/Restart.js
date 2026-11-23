// Sample code to import a client and other constants.
/*
const { restart } = require('../../config.js');
const { helpMenu, readline, spawn, exitHandler, server } = require('../../index.js');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
*/
const { restart, frameName } = require("#config/core/core");
const { pluginName } = require("#config/cosmetic/config");
const { date } = require("#functions/core/date");
const delay = require("#functions/core/delay");
const { loadHelp } = require("#functions/core/load");
const { log } = require('#functions/core/log.mjs');
const { gracefulShutdown, refreshCycle, reload } = require('#functions/core/powerCycle');
const { spawn } = require('child_process');

module.exports = {
    // Example of a help menu given by the bot.
    // Input: none
    // Expected Return: An array of strings.
    help() {
        return [
            'Built-in:',
            '/help (page) - Opens this help menu.',
            '/h (page) - Mirror of /help.',
            'The help menu can be expanded upon by other plugins.',
            '/info (page) - Opens a neat info menu!',
            'This function can\'t be expanded upon by other plugins.',
            '/reload - Mirror of /refresh',
            '/refresh - Refreshes commands, etc.',
            '/restart - Restarts the bot. Recommended when updating.',
            '/rs - Mirror of /restart',
            '/stop - Closes bot.',
            '/end - Mirror of /stop.',
        ];
    },
    // Example of a command in the CLI (command line) of the bot.
    // Input: command given by the bot
    // Expected Return: true or false depending on if the command was valid or not. Otherwise, this breaks the code used to determine if a command is valid or not.
    async command(command) {
        switch (command.split(" ")[0].toLowerCase()) {
            case "/h":
            case "/help":

                const helpMenu = await loadHelp("console")

                // Help Menu
                let page;
                if (command.split(" ")[1] != undefined) {
                    page = Number(parseInt(command.split(" ")[1].toLowerCase(), 10));
                    if (isNaN(page) || page < 1) {
                        page = 1;
                    }
                } else {
                    page = 1;
                }
                log.info(`\x1b[36m----------------- Help menu: (${page}/${Math.ceil((helpMenu.length) / 8)}) -----------------\x1b[0m`)
                for (let i = (page - 1) * 8; i < Math.min(8 + ((page - 1) * 8), helpMenu.length); i++) {
                    log.info(helpMenu[i])
                }
                log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                return true;
            case "/info":
                let info;
                const infoList = [
                    'Version control:',
                    'The first number (X.0.0) is the major release.',
                    'The second number (0.X.0) is the minor release.',
                    'The third number (0.0.X) is the patch #.',
                    'Breaking changes may occur between Prism 0.x releases.',
                    'Compatibility is not guaranteed until v1.0.0.',
                    'Built-in plugins aside from "built-in" are typically',
                    'not updated as often, and may be unstable.',
                    'What means what?',
                    `${frameName} version is the version of the NodeJS framework.`,
                    `${pluginName} version is the version of the plugins / deployment.`,
                    'Dev is the dev instance, prod is the prod instance.',
                    'Disclaimers:',
                    'Third party plugins are not guaranteed to be supported.',
                    'Prism is in active development and may introduce breaking changes.',
                    'Have fun running this! - Nexint',
                ];
                if (command.split(" ")[1] != undefined) {
                    info = Number(parseInt(command.split(" ")[1].toLowerCase(), 10));
                    if (isNaN(info) || info < 1) {
                        info = 1;
                    }
                } else {
                    info = 1;
                }
                log.info(`\x1b[36m----------------- Info menu: (${info}/${Math.ceil((infoList.length) / 8)}) -----------------\x1b[0m`)
                for (let i = (info - 1) * 8; i < Math.min(8 + ((info - 1) * 8), infoList.length); i++) {
                    log.info(infoList[i])
                }
                log.info(`\x1b[36m--------------------- Nex ${date.getFullYear()} ---------------------\x1b[0m`)
                return true;
            case "/end":
            case "/stop":
                await gracefulShutdown("Console // Shutdown", true)
                return false; // This should not run, but like
            case "/rs":
            case "/restart":
                await gracefulShutdown("Console // Restart", false)
                const child = spawn(restart, {
                    detached: true,
                    shell: true,
                    stdio: 'ignore'
                })
                child.unref()
                await delay(1000)
                process.exit(0);
            case "/refresh":
                await refreshCycle("Console // Refresh")
                return true;
            case "/reload":
                await reload("Console // Reload")
                return true;
            default:
                return false;
        }
    }
}