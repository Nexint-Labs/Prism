# Existing startup and deployment behavior

This document describes the launch code statically. None of the launch strings, repository scripts, network requests, or database operations described here were executed during documentation work.

## Launch definitions

| Source | Existing behavior |
| --- | --- |
| [`package.json`](../package.json) | `main` is `index.js`; `start` is `node index.js`. The separate `test` script is not part of startup. |
| [`start.bat`](../start.bat) | Invokes `node index.js`, then `exit`; does not explicitly forward arguments or change directory. |
| [`start.sh`](../start.sh) | Bash script sources `/home/backend/.nvm/nvm.sh`, then invokes `npm start`. No explicit version selection, directory change, or argument forwarding. |
| [`nvm.sh`](../nvm.sh) | Contains the same two shell operations as `start.sh`; despite its name it is not the NVM installation script. |
| [`config/core/core.js`](../config/core/core.js) | `restart` is `start start.bat`, consumed by console restart using `spawn(..., { shell: true })`. |

`index.js` attempts `process.chdir(__dirname)`, catches failure, and proceeds. Dotenv and initial configuration imports happen before that change. File paths for logs and SQLite storage are relative, so launch directory/chdir success matters. The code creates missing `logs`, `plugins`, and `preload` directories, but does not create missing `console` subdirectories or install dependencies.

## Manager flags and worker differences

[`index.js`](../index.js) scans `process.argv` for exact flag strings; unknown values are ignored by this switch.

| Flag | Implemented manager effect |
| --- | --- |
| `--log-disable` | Skip log-file stream and stdout/stderr redirection |
| `--safe` | Set local `safeMode` and `verbose` true, `autoUpdate` false; skip console modules and manager version fetch |
| `--chat-log` | Set exported manager `chatLog` true |
| `--no-update` | Disable hourly manager polling; initial fetch still occurs |
| `--verbose` | Enable additional manager output and set worker `PRISM_VERBOSE` through the manager's environment assignment |

In [`bot.js`](../bot.js), `safeMode` and `chatLog` remain local `false` constants in practice (declared with `let` but never changed); there is no corresponding argument parser or manager-value propagation. Only verbose is read from `PRISM_VERBOSE`. Thus manager `--safe` does not disable worker preloads/plugins, manager `--chat-log` does not activate the worker's alternate presence branch, and worker update fetches still occur. The manager's safe-mode message says logging is disabled, but its safe flag does not set `logging = false`; `--log-disable` is independent. No all-message chat-log implementation is established by these flags.

## Cluster lifecycle and command deployment

`index.js`, `main()`, constructs `ClusterManager` with `bot.js`, process mode, token, and verbose cluster data. Normal settings are automatic shard count and two shards per cluster; configured `devMode` selects four shards and one per cluster. `ReClusterManager` and `AutoResharderManager` are installed. Auto-resharding options specify 1,400 minimum / 2,400 maximum guilds per shard and restart options `gracefulSwitch`, 7,000 ms delay, and timeout `-1`. These are library options passed by the source, not observed resharding outcomes.

Manager spawn also uses timeout `-1`. Workers preload databases and await Redis connection before constructing/login to Discord. After worker ready callbacks call `triggerReady()`, the manager requests global command deployment from cluster zero. Worker `deployCommands` uses the configured application ID and the entire command collection; it does not choose a deployment-specific plugin folder or development guild. Reload repeats deployment after worker acknowledgements. See [plugin reload](plugins.md).

The root README lists several Discord deployments, but the source does not establish their current processes, credentials, hosting configuration, or deployed file selections. No Docker/service/process-manager/reverse-proxy setup is defined by the inspected launch files. The source's launch configuration alone does not establish external supervision or successful operation.

## Network and persistent side effects of startup

Startup paths are not read-only. The manager writes `logs/<logFormat>.txt` unless disabled; workers synchronize local SQLite models and initiate Redis; both entry points can fetch remote update information; workers log into Discord; cluster zero deploys application commands.

[`preload/redis/redis.js`](../preload/redis/redis.js) constructs a Redis client using a fixed Upstash hostname/port and `rediss://default:<encoded redisToken>@...:6379`, with TLS, a 10,000 ms connect timeout, and reconnect delay `min(retries * 50, 3000)`. `connectRedis()` awaits `.connect()` unless the client is already open, catches/logs rejected connection attempts, and is awaited by `execute()`. The configured reconnect strategy has no retry-count stop condition; startup progress with unavailable Redis cannot be guaranteed statically. There is no empty-token bypass in this preload.

The `upstashPublisher` imports found outside the preload are in the older `functions/v1/mc/ecoServer.js` and its `legacy/functions/mc/ecoServer.js` counterpart; no current plugin/v2 import was found. A Redis connection attempt at startup does not establish active current Pub/Sub use. Database table recreation requests in notification/settings preloads are detailed in [database integration](database.md). No databases were opened to inspect their contents.

Additional command-time dependencies are visible in `functions/v2/api/klipy/gifs.js` (Klipy), `functions/v2/api/vocadb/vocadb.js` (VocaDB), `plugins/MikuBot/sekai/tierlb.js` (seka.ing), configured remote image URLs, and [NexAPI callers](nexapi.md). Their availability and credentials were not verified.

## HTTP behavior

[`index.js`](../index.js) constructs an Express app and listens on `config/core/api.js`'s `port` (currently 3000), without a host argument. It defines two GET routes:

- `/`: JSON with `name: "Backend"`, a MikuBot description, null `content`, and `refreshDate: Date.now()`.
- `/status`: JSON with `name: "Status"`, a MikuBot description, `content: { status: 1 }`, and a fresh timestamp.

These handlers do not probe Discord, NexAPI, Redis, worker readiness, or database health. The listener starts before console loading and cluster spawning. A successful `/status` response would therefore report a fixed value, not establish those components' readiness. No authentication or additional HTTP routes are installed by the inspected manager code.

## Shutdown, restart, and failures

[`console/handlers/commandHandler.js`](../console/handlers/commandHandler.js) handles stop by calling `server.close()`, closing readline, and awaiting `exitHandler()`. Restart additionally spawns the configured shell command, passes `detatched: true` (the spelling in source), and calls `child.unref()`. That misspelled option is an implementation inconsistency; detached behavior and platform portability were not verified.

`index.js`, `exitHandler()`, sets `consoleOpen = false` and starts an internal async function that delays one second and exits the manager with code zero. The outer function does not await that internal function. It does not await the HTTP close callback, explicitly close the log stream, destroy worker Discord clients, close Sequelize/Redis connections, or explicitly stop the cluster manager. The log lines about closing bot connections do not themselves perform that cleanup. Worker lifetime after manager exit is not established by this source review.

Both entry points log uncaught exceptions/unhandled rejections; `EPIPE` causes exit zero, while other cases are logged without an explicit process exit in those handlers. There are no SIGINT/SIGTERM handlers in the inspected entry points. Manager `main()` is invoked without a terminal catch; worker startup is an async invocation without one. The global handlers are therefore relevant to startup failure paths, but do not establish recovery or service health.
