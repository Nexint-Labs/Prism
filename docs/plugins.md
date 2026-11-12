# Plugin system

## Discovery and loading

[`bot.js`](../bot.js) defines `getJSFiles(directory)`: it recursively traverses directories, skips directories named exactly `archive`, and includes regular files ending in `.js`. It does not sort the filesystem results. It applies the same traversal to `preload/` and `plugins/`. There is no manifest, dependency graph, plugin version gate, isolation boundary, or folder-name enablement rule in this loader.

Preloads are required and their `execute()` hooks awaited before the Discord client/export is available. Unlike plugin loading, preload loading does not await `ready`. All current database preload modules expose `execute()`; Redis does as well. Importing these modules itself creates clients/model definitions before those hooks run. See [database initialization](database.md).

The manager's [`index.js`](../index.js) loader is separate: its `preloadPath` variable actually points to `console/`. Initial discovery expects subdirectories containing `.js` files, without recursion or a directory guard. Its reload implementation does check directories. Console initialization awaits `ready`, calls callable `execute()`, and collects callable `help()` independently.

## Recognized exports

These are observed conventions in the loaders and dispatcher, not a validated formal interface.

| Export | Current consumer and behavior |
| --- | --- |
| `data` and `execute` together | Worker serializes `data.toJSON()` during initial discovery and later stores the module under `data.name` in `client.commands`; interaction dispatcher calls `execute(interaction)` |
| `ready` | Manager console loading/reloading and worker plugin loading/reloading await this value if truthy; [`plugins/Neru/admin/config.js`](../plugins/Neru/admin/config.js) exports a Promise that builds subcommands |
| `execute` without `data` | Worker calls and awaits `execute()` in its second pass; Essential and Neru handlers use this to attach listeners |
| `help()` | Console loader spreads its returned entries into manager `helpMenu`; worker collects it only if neither command nor standalone execute branch matched |
| `command(input)` | Manager stdin parser awaits it until a module returns truthy; false means try the next module |
| `post(verbose)` | Manager after spawn, worker after client ready; called without awaiting the hook's returned Promise |
| `cooldown` | Essential interaction dispatcher interprets seconds, defaulting to three |
| `autocomplete(interaction)` | Essential dispatcher invokes it for autocomplete requests, with an empty-choice fallback |
| `config`, `messageCreate` | Accepted by loader warning checks; these properties alone do not register callbacks or apply settings |

Worker checks frequently test property presence rather than callable types. A `data` export must actually supply the builder methods used by the loader. Initial plugin discovery serializes builders into a local `commands` array, but deployment uses `client.commands`, not that array. Duplicate `data.name` values overwrite earlier entries in the collection; there is no duplicate rejection. Command lookup is keyed by name rather than by Discord command type.

## Registration and lifecycle

The worker exports `client` before requiring plugins, allowing modules to import `#bot`; the manager similarly exports services before requiring console handlers. Consumers must respect these startup boundaries. Loading JavaScript is unrestricted `require()`, so module-level side effects are possible. A loader warning does not unload a module or undo its side effects.

Initial worker registration is an `if / else if` chain: a command's `execute` is reserved for interactions and not called at startup; a non-command `execute` prevents that module's `help()` branch from running. Post-hook discovery is separate. Current event handler modules explicitly attach listeners with `client.on(...)` in their `execute()` functions; the loader does not automatically wire an exported `messageCreate` function.

## Reload behavior and limitations

Manager `reloadAllCommands()` delegates to `reloadHandler`, which sends `reloadCommands` requests concurrently to existing clusters. After every reply reports success, it asks cluster zero to `deployCommands`. A failed reply rejects the operation; there is no cross-worker rollback. [`console/handlers/commandHandler.js`](../console/handlers/commandHandler.js) invokes this and then `reloadConsoleCommands()` for `/reload` or `/refresh`.

Worker `reloadCommands()` rediscovers plugin files, deletes their individual `require.cache` entries, requires them again, awaits `ready`, builds a new command collection, and replaces `client.commands` only after the scan completes. It does not recursively invalidate dependencies under `functions/` or `config/`, rerun non-command `execute()` hooks, rebuild `helpMenu`, update the original `commandList`, rerun preloads, or remove previously attached event listeners. Cooldown collections persist. Module-level side effects can still run on re-require. A failed scan may leave module side effects/cache changes even though the active collection was not replaced.

Manager `reloadConsoleHandler()` rediscovers console files, invalidates their cache entries, awaits `ready`, and rebuilds command/help arrays in place. It does not rerun `execute()` or `post()`. Removed modules are omitted from the new arrays, but no explicit disposal hook exists. Neither loader defines unload/destroy hooks or orderly plugin resource cleanup.

Manager `--safe` suppresses its console plugins. Worker `safeMode` remains initialized to `false` without argument parsing or manager propagation. Safe mode therefore does not establish a plugin-free worker. See [deployment flags](deployment.md).
