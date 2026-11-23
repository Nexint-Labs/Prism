const { Client, Collection, REST, Routes } = require('discord.js');
const { ClusterClient, getInfo, AutoResharderClusterClient } = require('discord-hybrid-sharding');
const { loadCommands, deployCommands } = require('#functions/discord/load');
const { discordToken: token, botStatus, botActivity, botType, intents, partials } = require('#config/discord/discord');
const { log } = require('#functions/core/log.mjs');
const fileLog = require('#preload/core/fileLog');
const { errorPolicy } = require('#config/core/core');

const bot = async function () {
    await fileLog.execute()

    const client = new Client({
        shards: getInfo().SHARD_LIST,
        shardCount: getInfo().TOTAL_SHARDS,
        intents,
        partials,
        presence: {
            status: botStatus,
            activities: [{
                name: botActivity,
                type: botType
            }]
        }
    });

    client.cluster = new ClusterClient(client);
    new AutoResharderClusterClient(client.cluster, {
        // OPTIONAL: Default is 60e3 which sends every minute the data / cluster
        sendDataIntervalMS: 60e3
    })

    // Can also be in a separate event handler. The triggerReady must be called.
    client.once("clientReady", async (readyClient) => {
        try {
            await loadCommands("plugins", readyClient);
            readyClient.cluster.triggerReady();
        } catch (error) {
            log.error("Failed to initialize Discord commands.", error);
            await log.fatal("Cluster failed to initialize commands.", error, 0x0001, true);
        }
    })

    client.commands = new Collection();

    client.cluster.on('message', async message => {
        if (message?.type === 'reloadCommands') {
            try {
                const count = await loadCommands("plugins", client);

                log.success(`Reloaded ${count} commands.`);

                message.reply({
                    success: true,
                    count: count
                });
            } catch (error) {

                log.error(`Reload failed:`, error);

                message.reply({
                    success: false,
                    error: error.message
                });
            }

            return;
        }

        if (message?.type === 'deployCommands' && client.cluster.id === 0) {
            try {
                const rest = new REST().setToken(token);
                const commands = await deployCommands("plugins", rest);

                log.success(`Deployed ${commands.length} commands.`);

                message.reply({
                    success: true,
                    count: commands.length
                });
            } catch (error) {

                log.error(`Deployment failed:`, error);

                message.reply({
                    success: false,
                    error: error.message
                });
            }
        }
    });

    client.on("error", (error) => {
        log.error("Discord client error.", error);
    });

    client.on("warn", (message) => {
        log.warn(`Discord client warning: ${message}`);
    });

    client.on("shardError", (error, shardId) => {
        log.error(`Discord shard ${shardId} error.`, error);
    });

    await client.login(token);

}

bot().catch(async error => {
    if (errorPolicy.unhandledRejection == "shutdown") {
        await log.fatal("Cluster failed to initialize.", error, 0x0001, true)
    } else {
        log.error("Cluster failed to initialize.", error);
    }
});