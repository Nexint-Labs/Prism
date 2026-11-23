const fs = require("node:fs");
const path = require('path');
const { log } = require("../core/log.mjs");
const { Client, REST, Collection, Routes } = require("discord.js");
const { clientId } = require("#config/discord/discord");
const { verbose, errorPolicy } = require("#config/core/core");
const { forceShutdown } = require("#functions/core/fatalShutdown.mjs");


/**
 * Deploy commands?
 * ClientID is already supplied in configs lol
 * @param {String} dir 
 * @param {REST} rest 
 */
const deployCommands = async function (dir, rest) {

    // loading???
    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    const commandArray = [];
    for (const file of files) {

        // Only load JS files (trust)
        if ([".js", ".cjs", ".mjs"].includes(path.extname(file).toLowerCase())) {

            // Execute the plugin?
            try {
                const plugin = require(path.join(process.cwd(), dir, file));

                if ('ready' in plugin) {
                    await plugin.ready();
                }

                if ('data' in plugin && 'execute' in plugin) {
                    if (verbose) {
                        log.info(`Deploying the command "${plugin.data.name}" in "${path.join(process.cwd(), dir, file)}" to Discord.`)
                    }
                    commandArray.push(plugin.data.toJSON());
                }
            } catch (error) {
                if (errorPolicy.uncaughtException === "continue") {
                    continue;
                } else if (errorPolicy.uncaughtException === "warn") {
                    log.error("Failed to load command.");
                    log.error(`Problematic file: ${path.join(dir, file)}`, error);
                    continue;
                } else {
                    log.error("Failed to load command.");
                    log.error(`Problematic file: ${path.join(dir, file)}`, error);
                    await forceShutdown("Failed to load command.");
                }
            }
        }
    }

    const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandArray },
    );
    return data
}


/**
 * Load commands
 * @param {String} dir 
 * @param {Client} client 
 */
const loadCommands = async function (dir, client) {

    // New collection every single time it loads lol
    // what am i doing
    client.cooldowns = new Collection();
    client.commands = new Collection();

    const files = fs.readdirSync(path.join(process.cwd(), dir), { recursive: true });
    let count = 0;
    for (const file of files) {

        // Only load JS files (trust)
        if ([".js", ".cjs", ".mjs"].includes(path.extname(file).toLowerCase())) {

            // Execute the plugin?
            try {
                const plugin = require(path.join(process.cwd(), dir, file));

                if ('ready' in plugin) {
                    await plugin.ready();
                }

                if ('data' in plugin && 'execute' in plugin) {
                    if (verbose) {
                        log.info(`Pushing "${plugin.data.name}" in "${path.join(process.cwd(), dir, file)}" to client.`)
                    }
                    client.commands.set(plugin.data.name, plugin)
                    count += 1;
                } else if ('execute' in plugin && !plugin.hostOnly) {
                    await plugin.execute(client)
                }
            } catch (error) {
                if (errorPolicy.uncaughtException === "continue") {
                    continue;
                } else if (errorPolicy.uncaughtException === "warn") {
                    log.error("Failed to load command.");
                    log.error(`Problematic file: ${path.join(dir, file)}`, error);
                    continue;
                } else {
                    log.error("Failed to load command.");
                    log.error(`Problematic file: ${path.join(dir, file)}`, error);
                    await forceShutdown("Failed to load command.");
                }
            }
        }
    }
    return count
}

module.exports = {
    loadCommands,
    deployCommands
}