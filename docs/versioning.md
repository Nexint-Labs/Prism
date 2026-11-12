# Versioning and compatibility

## Separate version values

[`config/core/update.js`](../config/core/update.js) exports the values shown below. They are independent from package metadata and are not computed from Git.

| Value | Current export | Use |
| --- | --- | --- |
| `version` | `0.6.0` | Framework display version |
| `versionID` | `12` | Numeric remote update comparison |
| `botChannel` | `dev` | Framework display channel |
| `pluginVer` | `0.5.1` | Bot/plugin deployment display version |
| `pluginChannel` | `prod` | Deployment display channel |
| `fileCount` | `2` | Expected manager console-module count |

[`console/handlers/devCommandHandler.js`](../console/handlers/devCommandHandler.js), `/print version` and `/print build`, displays framework and deployment values separately. [`plugins/Shared/Utilities/info.js`](../plugins/Shared/Utilities/info.js) displays the same values with the worker's startup `latestVersion`.

[`package.json`](../package.json) instead names package `Prism` at version `0.5.0`, with license `AGPL-3.0-only`. [`package-lock.json`](../package-lock.json) has root metadata `CoreBot`, version `1.0.0`, license `ISC`, and lockfile version 3. This is a source metadata discrepancy; the package, framework, deployment, and lockfile root versions should not be silently treated as identical. The lockfile was read, not regenerated.

## Dependency versions recorded locally

Declared ranges come from `package.json`; resolved versions come from the corresponding `node_modules/<name>` entries in `package-lock.json`. These do not confirm installed/runtime versions or tested compatibility.

| Dependency | Declared range | Lockfile version |
| --- | --- | --- |
| `discord.js` | `^14.14.1` | `14.27.0` |
| `discord-hybrid-sharding` | `^3.0.1` | `3.0.1` |
| `dotenv` | `^18.0.8` | `18.0.8` |
| `express` | `^5.2.1` | `5.2.1` |
| `node-fetch` | `^3.3.2` | `3.3.2` |
| `redis` | `^6.2.1` | `6.2.1` |
| `sequelize` | `^6.37.5` | `6.37.8` |
| `sqlite3` | `^6.0.1` | `6.0.1` |
| `linkify-it` | `^6.1.0` | `6.1.0` |
| `profanease` | `^2.0.3` | `2.0.3` |
| `dependency-cruiser` (development) | `^18.7.2` | `18.7.2` |

The project package does not declare `engines`. Individual lockfile entries do: examples include `discord.js` Node `>=18`, `redis` `>= 20.0.0`, `sqlite3` `>=20.17.0`, and development tool `dependency-cruiser` `^22||^24||>=26`. These are recorded package constraints, not a complete derived compatibility guarantee for the dependency graph. Neither `start.sh` nor `nvm.sh` selects a Node version; both merely source a fixed NVM path before invoking the start script.

Current source uses Components V2 builders/flags (`functions/v2/discord/container.js`), global fetch (`functions/v2/api/fetch.js`), and `AbortSignal.timeout` (`functions/v2/api/vocadb/vocadb.js`). The worker does not install the manager's `node-fetch` wrapper into the global scope. No runtime feature or library-version probe is implemented in these entry points. Compatibility with the minimum declared ranges has not been exercised.

## Update checks

Both entry points define `getUpdateVersion()` to fetch the raw `main` branch `config/core/update.js` from the Nexint-Labs/Prism GitHub repository. They read the response as text, inspect every line containing `versionID`, strip non-digits, and keep the last matching result. They do not import/evaluate the remote JavaScript, compare semantic versions, inspect Git history, or check HTTP status before parsing. Fetch/parse errors log and return zero.

Manager `updateCheck()` compares the local numeric ID to this result. A larger remote ID is called outdated; a smaller nonzero ID is called experimental. Differences are labeled "commits" in the output, although the implementation only subtracts configured IDs. A gap of at least five prints an additional warning. Zero means unavailable except that the local-ID-less-than-remote branch precedes that check.

Manager `asyncFunctions()` increments `count` once per console-module path, not per Discord plugin or repository file. If count is positive and differs from `fileCount`, startup labels the instance modified and skips its comparison message. `autoUpdateCheck()` runs only if count is zero or equals `fileCount`, sleeps one hour between checks, and loops while `consoleOpen`. Adding/removing a Discord plugin alone does not affect this count. Reloading console arrays does not recompute this startup counter.

`--no-update` disables the manager's repeated polling, not its initial version fetch or workers' independent startup fetches. Manager `--safe` suppresses its fetch through the local safe flag, but the worker safe flag remains false. The manager exports the initial `latestVersion` primitive; subsequent hourly local reassignment does not refresh consumers that destructured the export. Workers similarly expose their own startup result and have no repeated update loop.

## Release and plugin conventions

The console `/info` list in [`console/handlers/commandHandler.js`](../console/handlers/commandHandler.js) describes major/minor/patch numbering and explicitly states that breaking changes may occur between `0.x` releases, with compatibility not guaranteed until `1.0.0`. These are explanatory strings, not enforced release rules.

The plugin loader does not compare `pluginVer`, `pluginChannel`, or a plugin manifest against the framework. The NexAPI `/api/v1` path is hardcoded routing, not a handshake with a server deployment version. No automated tag/release convention or live deployment inventory can be established from the inspected startup/version code. No Git metadata was changed or used to infer release history.
