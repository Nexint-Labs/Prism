const { getConfig } = require("#functions/core/getConfig");
const { devMode, verbose } = getConfig("core/core");
const { ClusterManager, AutoResharderManager, ReClusterManager } = require('discord-hybrid-sharding');
const { discordToken: token } = require('#config/discord/discord');
const { root: sourceDir } = require("#functions/core/dirs");
const { log } = require('#functions/core/log.mjs');
const { forceShutdown } = require('#functions/core/fatalShutdown.mjs');

// Auto Sharding
let totalShards = "auto";
let totalClusters = "auto";
let shardsPerClusters;
let manager = null;
let shuttingDown = false;

if (devMode) {
    /*
    totalShards = 4;
    totalClusters = 2;
    shardsPerClusters = 2;
    */
}

function createManager() {
    return new ClusterManager(`${sourceDir}/appHelpers/bot.js`, {
        totalShards,
        totalClusters,
        ...(shardsPerClusters !== undefined && { shardsPerClusters }),
        mode: "process",
        token
    });
}

module.exports = {
    get manager() {
        return manager;
    },
    async execute() {
        shuttingDown = false;
        manager = createManager();

        // Reclustering
        manager.extend(
            new ReClusterManager()
        )

        // Auto Resharding
        manager.extend(
            new AutoResharderManager({
                /* If you need a debug information*/
                debug: true,
                /* how many shards per cluster should be spawned */
                ShardsPerCluster: 'useManagerOption', // or a specific number

                /* minimum amount of guilds each shard should contain */
                MinGuildsPerShard: 'auto', // or auto

                /* maximum amount of guilds each shard should contain -> if exceeded it auto. "re-shards" the bot */
                MaxGuildsPerShard: 2400,

                /* OPTIONAL: RestartOptions which should be used for the ClusterManager */
                restartOptions: {
                    /** The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed  */
                    restartMode: 'gracefulSwitch', // or 'gracefulSwitch
                    /** The delay to wait between each cluster spawn */
                    delay: 7e3, // any number > 0 | above 7 prevents api ratelimit
                    /** The readyTimeout to wait until the cluster spawn promise is rejected */
                    timeout: -1,
                }
            })
        );

        manager.on('clusterCreate', cluster => {
            if (verbose) {
                log.info(`Launched Cluster ${cluster.id}`)
            }

            cluster.on('death', () => {
                log.warn(`Cluster ${cluster.id} died`);

                setImmediate(async () => {
                    if (shuttingDown) return;
                    if (!manager || manager.clusters.get(cluster.id) !== cluster) return;
                    if (cluster.thread) return;

                    if (cluster.restarts.current >= cluster.restarts.max) {
                        await forceShutdown(
                            `Cluster ${cluster.id} exceeded maximum restart attempts.`
                        );
                    }
                });
            });

            cluster.on('spawn', () => {
                if (verbose) {
                    log.info(`Cluster ${cluster.id} spawned`)
                }
            });

            cluster.on('ready', () => {
                log.success(`Cluster ${cluster.id} ready`)
            });
        });

        await manager.spawn({ timeout: -1 });

        const usernames = await manager.broadcastEval(c => ({
            username: c.user?.username,
            discriminator: c.user?.discriminator
        }));

        const user = usernames[0];
        log.success(`Logged into ${user.username}#${user.discriminator}.`);

        const cluster0 = manager.clusters.get(0);
        const result2 = await cluster0.request({
            type: 'deployCommands'
        });

        if (!result2.success) {
            throw new Error(result2.error);
        }
    },
    async refresh() {
        await manager.recluster.start({
            restartMode: 'gracefulSwitch'
        });

        const cluster0 = manager.clusters.get(0);
        const result2 = await cluster0.request({
            type: 'deployCommands'
        });

        if (!result2.success) {
            throw new Error(result2.error);
        }
    },
    async close() {
        if (!manager) return;

        shuttingDown = true;

        const oldManager = manager;

        oldManager.queue.stop();

        for (const cluster of oldManager.clusters.values()) {
            await cluster.kill({ force: true });
        }

        oldManager.clusters.clear();
        oldManager.removeAllListeners();

        manager = null;
    }
}