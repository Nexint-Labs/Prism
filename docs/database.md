# Database integration and ownership

## Initialization

[`bot.js`](../bot.js) recursively requires every JavaScript module under `preload/` and awaits exported `execute()` hooks before constructing the Discord client. All [`preload/dbs/`](../preload/dbs/) modules construct Sequelize instances with `dialect: 'sqlite'`, `logging: false`, and relative storage filenames. Their placeholder database/user/password and `host: 'localhost'` constructor arguments do not describe a remote database connection: these definitions explicitly choose SQLite storage.

The manager attempts to change its working directory to the repository directory before spawning workers. Storage paths themselves are not resolved against `__dirname`. Every worker runs this preload sequence; no manager-only schema coordinator is implemented. Existing database contents, actual tables, and concurrent synchronization outcomes were not inspected or verified.

Most hooks call model `.sync()` without options. Two modules explicitly request destructive synchronization:

- [`notif.js`](../preload/dbs/notif.js), `execute()`: `userNotify.sync({ force: true })`.
- [`settings.js`](../preload/dbs/settings.js), `execute()`: both `settings.sync({ force: true })` and `userSettings.sync({ force: true })`.

Those calls request table recreation on each worker's startup, even though no current plugin/v2 consumer of these models was found. No migrations are invoked by the entry points. [`scripts/migrate.cjs`](../scripts/migrate.cjs) rewrites JavaScript imports; it is not a database migration.

## Explicit model definitions

Tables below use exported variable names; parenthesized names are the strings passed to `define()`. They list application-declared attributes, not an observed SQLite schema. Most models do not explicitly configure primary keys, timestamps, or table-name freezing; this documentation does not infer actual physical table layouts from the filesystem's `.sqlite` files.

### Core and older logging models

Source: [`preload/dbs/databases.js`](../preload/dbs/databases.js).

| Storage / instance | Model | Declared fields and constraints |
| --- | --- | --- |
| `database.sqlite` / `sequelize` | `optOut` (`optout`) | `author: STRING`, unique |
| Same | `blacklistServer` | `serverId: STRING`, unique |
| `moderation.sqlite` / `moderation` | `logging` | `startChannel`, `endChannel`: STRING |
| Same | `blacklist` | `user`, `channel`: STRING |

`functions/v2/opt-out/optOut.js` reads opt-out rows. `functions/v2/auth/checkServerBlacklist.js` provides local server blacklist queries/add/remove, used by the guild handler and NexAPI administration handlers. No active current plugin/v2 use of the older `logging` and `blacklist` models was established. `plugins/Neru/admin/bypassLogs.js` only sends a WIP response; its bypass implementation is commented out and does not import these models. The local server blacklist is separate from the remote NexAPI user blacklist.

### Analytics

Source: [`preload/dbs/analytics.js`](../preload/dbs/analytics.js), instance `analytics`, storage `analytics.sqlite`.

| Model | Declared fields |
| --- | --- |
| `usage` (`commands`) | `type: STRING`, `value: DOUBLE` |
| `userinfo` | `userId`, `name`, `registerDate`, `lastUsed`: STRING; `value: DOUBLE` |
| `cmdDate` (`cmddate`) | `type`, `date`: STRING |

[`functions/v2/analytics/usageData.js`](../functions/v2/analytics/usageData.js), `addCommandsUsed()`, conditionally increments aggregate and user counters and records a command date when the user has not opted out. This is called by individual commands, not the universal dispatcher. Helpers also sync models when queried. `optOutUsageData()` deletes that user's `userinfo` row, not the aggregate/date rows. `queryCmds()` starts deletions through asynchronous `forEach` callbacks without awaiting all deletions. Its return value is not proof that cleanup completed. The catch block in `optOutUsageData()` references `error` without binding it in `catch`; its failure path can itself fail.

### Fun/action and notification preferences

Source: [`preload/dbs/funDBs.js`](../preload/dbs/funDBs.js), instance `fundb`, storage `fundb.sqlite`.

| Model | Declared fields |
| --- | --- |
| `action` | `userId`, `actionId`, `type`: STRING; `value: INTEGER` |
| `hugs` | `userId`, `huggedId`: STRING; `value: INTEGER` |
| `pat` | `userId`, `pattedId`: STRING; `value: INTEGER` |
| `hello` | `userId`, `helloId`: STRING; `value: INTEGER` |
| `boop` | `userId`, `boopId`: STRING; `value: INTEGER` |
| `poke` | `userId`, `pokeId`: STRING; `value: INTEGER` |
| `punch` | `userId`, `punchId`: STRING; `value: INTEGER` |
| `kill` | `userId`, `killId`: STRING; `value: INTEGER` |
| `notify` | `userId: STRING`, unique |

The preload comments mark older action-specific models for future removal, but they remain defined and synchronized. Current Teto/action v2 plugins send action updates to NexAPI; local model existence does not establish ongoing local writes. `notify` is actively read by `functions/v2/notify/dmNotify.js` and `checkNotifs.js`, and updated by `plugins/Shared/Utilities/notify.js`, to suppress notifications.

[`functions/v2/actions/actionCmds.js`](../functions/v2/actions/actionCmds.js), `optOutAction()`, immediately returns `true`. Its deletion implementation is commented out. [`plugins/Shared/Utilities/optout.js`](../plugins/Shared/Utilities/optout.js) calls it, then remote currency deletion, local analytics deletion, and finally creates a local opt-out row. This sequence has no transaction spanning those systems. It does not establish that action data is deleted remotely or locally.

### Current moderation

Source: [`preload/dbs/moderation.js`](../preload/dbs/moderation.js), instance `modv2`, storage `modv2.sqlite`.

| Model | Declared fields and constraints |
| --- | --- |
| `moderation` | Non-null STRING `guildId`, `category`; unique pair |
| `joinMessage` (`join`), `leaveMessage` (`leave`) | Non-null STRING `channelId`; non-null TEXT `message`; non-null unique STRING `guildId` |
| `modChannels` (`modchannels`) | Non-null STRING `guildId`, `channelId`, `category`; unique `(guildId, category)` |
| `moderationCases` | Non-null STRING `guildId`, `type`, `targetId`; non-null INTEGER `caseId`; nullable STRING `moderatorId`, `liftedBy`; nullable TEXT `reason`; nullable DATE `liftedAt`; unique `(guildId, caseId)` |
| `moderationCounters` | STRING `guildId` primary key; non-null INTEGER `lastCaseId`, default zero |
| `chatRevive` | Non-null STRING `guildId` primary key, `channelId`, `roleId`; non-null INTEGER `cooldownSeconds`, default 3600; non-null BIGINT `lastRevivedAt`, default zero |

Query helpers in [`functions/v2/moderation/databaseQueries/`](../functions/v2/moderation/databaseQueries/) own reads/writes for guild configuration, cases, and revival. `addModCase.createModerationCase()` uses a `modv2.transaction`, creates/increments a guild counter, reloads it, and inserts the case using that counter. Errors return `{ error: true, reason, desc }`. This is a local database transaction, unrelated to remote currency operations.

`addChatRevive.claimChatRevive()` checks guild/channel and cooldown, then uses a conditional update on `lastRevivedAt` before returning the role and next available time. Timestamps here are seconds. Case lifting updates matching active warnings and records actor/date. No explicit Sequelize model associations or foreign-key references are declared in these preload files.

### Older notification, settings, and Sekai models

| Source / storage | Models and declared attributes |
| --- | --- |
| [`notif.js`](../preload/dbs/notif.js) / `notify.sqlite` | `devNotify`: STRING `type`, `content`, `title`, DOUBLE `date`; `userNotify`: STRING `userId`, DOUBLE `date`; `botNotify`: STRING `userId`, `type`, `content`, `title`, DOUBLE `date` |
| [`settings.js`](../preload/dbs/settings.js) / `settings.sqlite` | `settings`: STRING `type`, `content`, `title`, DOUBLE `date`; `userSettings` (defined as `userNotify`): STRING `userId`, `title`, DOUBLE `date` |
| [`sekai.js`](../preload/dbs/sekai.js) / `sekai.sqlite` | `vote`: STRING `userId`, `name`, `registerDate`, `lastUsed`; DOUBLE `value` |

These models are still initialized by automatic preloading. Current v2 notifications use NexAPI list/add endpoints and local funDB notification preferences. Current `tierlb` reads the seka.ing API. No imports of these three preload modules were found in current plugins/v2 helpers; older v1 notification helpers do import `notif.js`. There is no basis here to infer current model contents or active historical data migration.

## Currency ownership

[`functions/v2/currency/apiRead.js`](../functions/v2/currency/apiRead.js), `request()`, sends POST requests through NexAPI and returns `response.result` only if `response.error === false`. Current v2 currency account, bank, inventory, progression, and transaction adapters call this helper. There is no currency model/provider in `preload/dbs/` and no local fallback in that adapter, even though a `currency.sqlite` file exists in this workspace.

[`transactions/transfers.js`](../functions/v2/currency/transactions/transfers.js), [`transactions/wagers.js`](../functions/v2/currency/transactions/wagers.js), and atomic account adapters reject supplied truthy local transaction arguments with `CROSS_API_TRANSACTION`. Names such as `updateBalanceAtomic` describe the remote operation requested; the external service's implementation, atomicity, schema, retention, and idempotency cannot be verified from this client repository.
