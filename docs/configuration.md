# Configuration

## Loading and structure

Both [`index.js`](../index.js) and [`bot.js`](../bot.js) call `require('dotenv').config()` before requiring configuration modules. The manager changes directory to its own directory only afterward. There is no explicit dotenv path, application-wide configuration schema validator, or configuration reload in either entry point. Settings are CommonJS exports, cached on import. Plugin reload does not clear configuration dependencies.

Only variable names and example defaults are documented here; the local `.env` contents are not reproduced. Sources are [`.env.example`](../.env.example) and the configuration modules below.

| Environment variable | Export and source | Consumption/default |
| --- | --- | --- |
| `DISCORD_TOKEN` | `discordToken`, `config/core/discord.js` | Manager/worker Discord token; no module default |
| `DISCORD_CLIENT_ID` | `clientId`, same | Global Discord command deployment; no module default |
| `DEV_ID` | `devId`, same | Identity checks in owner/admin utilities; no module default |
| `DEV_GUILD_ID` | `devGuild`, same | Exported, but no consumer found in inspected current entry points/plugins/v2 helpers; not the command deployment target |
| `INVITE_CHANNEL_ID` | `inviteChannelID`, same | Guild join/leave reporting; defaults to empty string |
| `SERVER_URL` | `apiServer`, `config/api/NexAPI.js` | NexAPI base URL, default empty; client appends `/api/v1` directly |
| `SERVER_TOKEN` | `apiToken`, same | Token inserted into v2 POST bodies; default empty |
| `SERVER_HEADER` | `header`, same | Literal `Authorization` header value; default empty, no automatic Bearer prefix |
| `KLIPY_API_KEY` | `klipyKey`, `config/api/KlipyAPI.js` | GIF search key; default empty |
| `SEKAI_TOKEN` | `sekaingToken`, `config/api/SekaingAPI.js` | Authorization for `plugins/MikuBot/sekai/tierlb.js`; default empty |
| `REDIS_TOKEN` | `redisToken`, `config/api/RedisAPI.js` | Password used by Redis preload; default empty |
| `TENOR_API_KEY` | `tenorKey`, `config/api/deprecated/Tenor.js` | Deprecated configuration retained for older code; no current plugin/v2 consumer found |
| `AUTOMOD_API_TOKEN` | Example only | No current configuration/entry-point/plugin/v2 reader found; do not infer active AutoMod API support |
| `PRISM_VERBOSE` | Read directly in `bot.js` | Internal manager-to-worker setting: manager writes `String(verbose)`, worker enables verbose only for `'true'`; absent from `.env.example` |

The guild handler checks whether `inviteChannelID` is `undefined`, while its configuration defaults to `""`; an empty value can therefore still reach `sendMessage()` and log a failure. `preload/redis/redis.js` independently checks `process.argv.includes('--verbose')` rather than `PRISM_VERBOSE`.

## Module settings

| Source module | Settings and established behavior |
| --- | --- |
| [`config/core/core.js`](../config/core/core.js) | `devMode: false` changes manager shard layout; `devMsg` is an exported developer message; `devName: "Nexint"`, `botName: "Prism"`, `botFile: "Prism_PFP.webp"` supply identity/assets. `dateOptions` requests numeric hour/minute/second; `date` is constructed on import; `logFormat` includes local date/time components. `restart: "start start.bat"` is passed to shell spawn; `source` is the repository URL. Exports alone do not establish use at every call site. |
| [`config/core/discord.js`](../config/core/discord.js) | Intents: Guilds, GuildMessages, MessageContent, GuildMembers, DirectMessages. Partials: Channel and Message. Presence: `botActivity: "Thinking About You! | /help"`, `botStatus: "online"`, `botType: ActivityType.Playing`, `botURL: ""`. Worker initial presence uses the first three; its chat-log branch additionally uses `botURL`. `footerText` derives identity/year. `embedURL` and `embedIconURL` are labeled archived; current container footer imports `footerText`. |
| [`config/core/api.js`](../config/core/api.js) | `port: 3000` controls the manager HTTP listener; it does not configure NexAPI. No `PORT` environment reader is defined here. |
| [`config/core/update.js`](../config/core/update.js) | Framework and deployment version strings/channels, numeric update ID, expected console file count; see [versioning](versioning.md). |
| [`config/api/NexAPI.js`](../config/api/NexAPI.js) | `apiName: "NexAPI"`, credential/base exports above; `delay: 300` is compared against timestamps in seconds by blacklist/advert caches; `advertChance: 0.1`, `notifChance: 0.1` control random presentation/reminder decisions. The generic fetch client imports `delay` but does not apply it. |
| [`config/core/colors.js`](../config/core/colors.js) | `infoColor`, `defaultColor`, `warnColor`, `delMsgColor`, `muteColor`, `kickColor`, `banColor`, `pardonColor`; resolved by `functions/v2/core/setColor.js`. |
| [`config/visual/botAssets.js`](../config/visual/botAssets.js) | `pfp`, `warning`, `loading`, `miku` descriptors (`desc`, `url`) assembled from a fixed file-host base and filenames. |
| [`config/visual/emoji.js`](../config/visual/emoji.js) | `emoji.typeEmoji`, `loadEmoji`, `pfpEmoji` contain fixed Discord emoji strings. |
| [`config/visual/menu.js`](../config/visual/menu.js) | `pageSize: 10`, `configSize: 2`; `functions/v2/discord/menus/pageHandler.js` imports `pageSize`. Exporting `configSize` does not establish that every menu uses it. |
| [`config/fun/8ball.js`](../config/fun/8ball.js) | Exports `getAnswer()`, selecting one of three response-category arrays uniformly and then one answer from that category; not a flat uniform choice across all answers. |
| [`config/essential/validTypes.js`](../config/essential/validTypes.js) | Exports a Set of JavaScript type names used by `functions/v2/core/assert.js`. |
| [`config/mod/moderation.js`](../config/mod/moderation.js) | Exports `spamLog: 4`, `spamDelete: 6`, `spamWarn: 7`, `spamDelay: 2`, `muteWarnCount: 3`, `muteBanCount: 3`, `spamWarnReason: "Spamming"`. No import of this module was found in current entry points/plugins/v2 helpers. Current `moderateMessage()` does not implement these spam thresholds. |

## Guild settings stored in SQLite

[`functions/v2/moderation/helpers/configEngine.js`](../functions/v2/moderation/helpers/configEngine.js), `createConfigEngine()` and `getConfigDefinitions()`, supply the shared configuration definitions consumed by `plugins/Neru/admin/config.js` and `config-gui.js`. These are distinct from exported JavaScript configuration and from the currently unreferenced settings preload models.

- `moderation` fields `invite`, `links`, `swears`, `slurs` create/delete `(guildId, category)` rows. A row means blocked, absence means allowed (`addModerate.js`). Message moderation checks those categories in that order and stops after successful handling.
- `modlog` and `msglog` store a channel per guild/category; omitted channel falls back to the interaction channel.
- `join` and `leave` store a message and channel per guild. Default messages are `Welcome ${user}!` and `Goodbye ${user}. (${username})`. The member event handler substitutes `${user}`, `${username}`, `${server}`, and `${memberCount}` case-insensitively.
- `revive` configures a role, channel, and duration. `addChatRevive.createChatRevive()` validates channel/role/permissions, parses duration with `calcDuration`, and preserves an existing cooldown timestamp. The model defaults to 3,600 seconds. `chat-revive.execute()` claims the cooldown before attempting its role-ping message; a failed ping does not reset it.

These definitions and helpers describe supported code paths, not confirmation of any guild's saved settings or Discord permissions.
