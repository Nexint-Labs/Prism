# Commands and registration

## Discord registration and dispatch

[`bot.js`](../bot.js) discovers modules throughout `plugins/`. A module with `data` and `execute` is registered under `data.name` in `client.commands`. Cluster zero handles the manager's `deployCommands` message by serializing this collection and making a REST PUT to `Routes.applicationCommands(clientId)`. This is application-wide registration; `devGuild` does not select a guild-specific route. Startup deploys after clusters spawn; manager reload deploys after all workers report successful reloads.

[`plugins/Essential/Handlers/slashHandler.js`](../plugins/Essential/Handlers/slashHandler.js), `execute()`, installs `Events.InteractionCreate` handling:

- Autocomplete looks up `interaction.commandName`, calls the module's `autocomplete`, and returns empty choices if absent or on error where possible. It bypasses command cooldown handling.
- Chat-input and context-menu interactions look up the same name-based registry. Unknown commands log an error without a fallback reply.
- Cooldowns are in-memory, per worker, per command name and user ID. They default to three seconds or use `command.cooldown`. The timestamp is recorded before `execute(interaction)`, so a failed command still consumes its cooldown.
- The handler catches command exceptions, attempts an ephemeral container reply/follow-up with advertisements and notification checks disabled, and logs the error. These response helper calls are not awaited in the catch block.

Blacklist checks, analytics, permissions, opt-out checks, and guild/context restrictions are implemented by individual modules or their builder metadata. The dispatcher does not enforce a universal blacklist, authorization check, or analytics increment. For example, [`Shared/Utilities/help.js`](../plugins/Shared/Utilities/help.js) explicitly checks the blacklist, while [`Testing/Shards.js`](../plugins/Testing/Shards.js) simply replies with routing details.

## Declared command inventory

The following names come from command builders, not help strings. They describe discoverable declarations, not a runtime-confirmed Discord registration. Source directories are under [`plugins/`](../plugins/). Where filenames differ from command names, mappings are given explicitly.

| Source | Declared top-level chat-input names |
| --- | --- |
| `MikuBot/actionv2/` | `act` (`act.js`), `fight` (`combat.js`), `react` (`react.js`), `social` (`social.js`) |
| `MikuBot/currency/` | `apply`, `baltop` (`balanceLeaderboard.js`), `beg`, `blackjack`, `coinflip`, `deposit`, `give` (`giveItem.js`), `lootbox` (`lootBoxOdds.js`), `pay`, `rob`, `rob-toggle` (`robOptOut.js`), `slots`, `snakeeye`, `use` (`useItem.js`), `bal` (`viewBal.js`), `inv` (`viewItems.js`), `multipliers` (`viewMultipliers.js`), `profile` (`viewProfile.js`), `shop` (`viewShop.js`), `withdraw`, `work` |
| `MikuBot/fun/` | `8ball`, `bean`, `cf` (`coinflip.js`), `major` (`major spelling mistake.js`), `minori` (`minori spelling mistake.js`), `tsundere` |
| Other `MikuBot/` | `gif` (`gifs/gifs.js`), `divorce` (`miku/divorce.js`), `marriage` (`miku/marry.js`), `propose` (`miku/propose.js`), `tierlb` (`sekai/tierlb.js`), `kana` (`silly/kanade.js`), `mizuover` (`silly/mizuover.js`), `song` (`vocaloid/song.js`) |
| `Neru/admin/` | `ban-id` (`ban-by-id.js`), `ban`, `bypass` (`bypassLogs.js`), `config-gui`, `config`, `kick`, `liftwarn` (`liftWarn.js`), `mute`, `unban`, `unmute`, `viewwarn` (`viewWarns.js`), `warn` |
| `Neru/utility/` | `chat-revive` (`chat-revive.js`) |
| `NexAPI/` | `nexapi` (`nexapi.js`) |
| `Shared/Utilities/` | `credits`, `gospel`, `help`, `info`, `miku-bot` (`miku.js`), `notify`, `data-opt-in` (`optin.js`), `data-opt-out` (`optout.js`), `ping`, `serverinfo`, `source`, `support`, `teto-bot` (`teto.js`), `updatelog` (`update.js`), `userinfo`, `view-notif` (`viewNotif.js`) |
| `Testing/` | `shardtest` (`Shards.js`); the loader has no development-only exclusion |
| `Teto/action/` | `action`, `boop`, `hug`, `kill`, `pat`, `poke`, `punch`, `wave` |
| `Teto/vocaloid/` | `kaito`, `len`, `luka`, `meiko`, `miku`, `neru`, `rin`, `teto`; each file derives its name from `capsName.toLowerCase()` |

[`Teto/actionContext/boop.js`](../plugins/Teto/actionContext/boop.js) and [`poke.js`](../plugins/Teto/actionContext/poke.js) declare message context-menu commands `Boop!` and `Poke!`, with `.setType(3)`. These use the same collection/dispatcher as slash commands.

Notable subcommand declarations:

- [`NexAPI/nexapi.js`](../plugins/NexAPI/nexapi.js): `blacklist`, `blacklist-id`, `whitelist`, `whitelist-id`, `viewlist`, `notify`, `notifications`, `invite`, `server-blacklist`, `server-whitelist`, `add-notification`; each delegates to its matching v2 handler. This module sets a five-second cooldown and integration/context arrays `[0, 1]` / `[0, 1, 2]`.
- [`Neru/admin/config.js`](../plugins/Neru/admin/config.js): its exported `ready` Promise builds `moderation`, `modlog`, `msglog`, `join`, `leave`, and `revive` subcommands from `getConfigDefinitions()`. It declares Administrator default member permissions and guild context. Its option builder marks every generated option optional, including fields marked required in shared definitions.
- [`MikuBot/miku/propose.js`](../plugins/MikuBot/miku/propose.js): `send`, `cancel`, `incoming`, `outgoing`. [`marry.js`](../plugins/MikuBot/miku/marry.js): `status`, `accept`.
- [`MikuBot/vocaloid/song.js`](../plugins/MikuBot/vocaloid/song.js): `random`, `search`, `producer`, with autocomplete support. [`MikuBot/currency/useItem.js`](../plugins/MikuBot/currency/useItem.js) also implements autocomplete through `getOwnedConsumables`.
- Action v2 builders define additional subcommands from in-file action definitions. Consult those builders for the full action/option sets; no separate plugin manifest defines them.

The hardcoded Discord help in `Shared/Utilities/help.js` is not generated from `client.commands`. It associates `/cf` with wagering and `/coinflip` with no stakes, while the actual builders assign `cf` to `MikuBot/fun/coinflip.js` and `coinflip` to `MikuBot/currency/coinflip.js`. Help also mentions names such as `gif-voca`, `gif-pjsk`, and `kanade` that do not appear as top-level builders in the inspected plugin inventory.

`Neru/admin/bypassLogs.js` declares `/bypass logging` but currently only sends a WIP response. Its implementation after that response is commented out; registration does not establish that logging bypass works.

## Console commands

Manager [`index.js`](../index.js), `commandParser()`, reads stdin, optionally logs the line, and traverses a snapshot of console modules. It awaits `command(input)`, stopping at the first truthy result. Exceptions are logged and treated as handled input. Unhandled input gets an invalid-command message.

[`console/handlers/commandHandler.js`](../console/handlers/commandHandler.js) lowercases the first space-delimited token:

| Input | Implementation |
| --- | --- |
| `/help [page]`, `/h [page]` | Eight help entries per page; missing, invalid, or below-one page becomes one |
| `/info [page]` | Eight entries per page from a fixed explanatory list, with the same page parsing |
| `/reload`, `/refresh` | Await worker reload/deployment, then console registry reload |
| `/stop`, `/end` | Request HTTP server closure, close readline, call `exitHandler()` |
| `/restart`, `/rs` | Close HTTP/readline, spawn configured shell restart command, unref child, call `exitHandler()` |

[`console/handlers/devCommandHandler.js`](../console/handlers/devCommandHandler.js) implements `/print version` (alias `v`) and `/print build` (alias `b`). Missing/other arguments print supported arguments. Despite its filename, the loader does not gate this module on `devMode` or Discord developer identity. Console commands depend on access to the manager's stdin. The `latestVersion` destructured from `#index` is its exported startup snapshot.
