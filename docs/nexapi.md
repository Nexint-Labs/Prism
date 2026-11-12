# NexAPI integration

## Shared transport

[`functions/v2/api/fetch.js`](../functions/v2/api/fetch.js) exports `getAPI(endpoint)` and `postAPI(endpoint, data)`, configured by [`config/api/NexAPI.js`](../config/api/NexAPI.js). Both concatenate `apiServer + '/api/v1' + endpoint`, call global `fetch`, set literal `Authorization: header` and `Content-Type: application/json`, and parse the response with `.json()`. There is no URL normalization, HTTP `ok`/status validation, explicit timeout, retry, or schema validation in this transport. The imported `delay` is unused here; caching belongs to callers.

`postAPI()` aliases the supplied object as `authData` and adds `authData.token = apiToken`, mutating the caller's object before checking the server configuration. It serializes that object into the POST body. It does not wrap a separate `data` field. Passing an unsuitable object can fail before the fetch catch block.

When `apiServer` is empty/null, both functions throw `NexAPIError` outside the request catch block. [`functions/v2/errors/NexAPIError.js`](../functions/v2/errors/NexAPIError.js) sets the error name and prefixes its message with `Could not connect to Nex API:`. For fetch/JSON failures inside the try block, transport logs and returns `{ error: true, desc: "Could not hit the Nexint API" }`. POST additionally logs the caught error. A non-success HTTP response containing valid JSON is returned as-is; success interpretation belongs to the caller.

The manager defines its own lazy `node-fetch` wrapper for update checks, but this does not install `fetch` globally for workers/helpers. Their runtime needs to supply the globals they use. No connection was attempted in this review.

## Active caller flows

Paths below are relative to the appended `/api/v1` prefix and describe client requests, not a verified server API specification.

| Caller | Method / path | Data used by this code |
| --- | --- | --- |
| [`auth/checkBlacklist.js`](../functions/v2/auth/checkBlacklist.js), `isBlacklisted()` | GET `/blacklist` | Reads `content.blacklist`, caches list with second-based `delay`, then compares IDs |
| [`api/advert.js`](../functions/v2/api/advert.js), `getAdvert()` | GET `/advert` | Caches `content`, selects an entry when random value is below `advertChance` |
| [`notify/listNotifs.js`](../functions/v2/notify/listNotifs.js), `listUnreadNotifs()` / `listAllNotifs()` | POST `/notifs/listUnread`, `/notifs/listAll` | `{ userId, refresh }`; callers consume `error` and `notifs` |
| Same, `addNotifs()` | POST `/notifs/addNotifs` | `{ title, content, type }` |
| [`currency/apiRead.js`](../functions/v2/currency/apiRead.js), `request()` | POST `/currency/<endpoint>` | Adapter-defined body; requires literal `error: false`, returns `result` |
| [`plugins/Teto/action/`](../plugins/Teto/action/), [`actionContext/`](../plugins/Teto/actionContext/), [`plugins/MikuBot/actionv2/`](../plugins/MikuBot/actionv2/) | POST `/actions/updateAction` | Action/participant data constructed by each plugin |
| [`plugins/MikuBot/miku/propose.js`](../plugins/MikuBot/miku/propose.js) | POST `/propose/addProposal`, `/propose/delProposal`, `/propose/getIncoming`, `/propose/getOutgoing` | Proposal request bodies constructed in each subcommand branch |
| [`plugins/MikuBot/miku/marry.js`](../plugins/MikuBot/miku/marry.js) | POST `/marriage/getStatus`, `/marriage/marry` | Marriage lookup/acceptance bodies |
| [`plugins/MikuBot/miku/divorce.js`](../plugins/MikuBot/miku/divorce.js) | POST `/marriage/getStatus`, `/marriage/delMarriage` | Status/deletion bodies |

The paths in the table refer to helpers under `functions/v2/` unless a full plugin path is shown.

### User blacklist, adverts, and notification side effects

`checkBlacklist(interaction)` passes the configured server into `isBlacklisted()` and sends a warning container when the ID matches. `isBlacklisted()` uses `serverParam || server`, but `server` is not defined in that module. An empty configured URL, or a direct call without a truthy server parameter, can therefore reference an undefined variable before reaching the fetch logic. With a truthy parameter, the parameter gates the refresh; the actual HTTP request still uses configured `apiServer` through `getAPI()`. A returned API error preserves prior cached blacklist data; a null list returns false. The module is not a universal dispatch guard.

`getAdvert()` refreshes when its cached list is null/expired. A returned transport error yields null; a missing-server exception propagates. There is no `devMode` check despite the comment describing one. [`discord/container.js`](../functions/v2/discord/container.js), `createAdvancedContainer()`, calls it whenever `advert` is true (the default), so even locally computed responses can need NexAPI unless callers disable advertisements.

[`notify/checkNotifs.js`](../functions/v2/notify/checkNotifs.js), `followUpNotif()`, first samples `notifChance`, checks local notification and general opt-out preferences, then lists unread notifications with `refresh: false`. [`discord/replyContainer.js`](../functions/v2/discord/replyContainer.js) checks notifications after replying by default. Listing notifications explicitly uses `refresh: true` in the notification commands. What `refresh` changes on the server cannot be established here.

### Currency client contract

[`currency/apiRead.js`](../functions/v2/currency/apiRead.js), `member(user)`, requires truthy `id` and `username` and converts them to `userId` / `username`; otherwise it throws `INVALID_USER`. `request()` makes a shallow copy of the body before calling `postAPI`, so token insertion does not mutate the adapter's original top-level object. It rejects missing responses or any response whose `error` is not exactly false, using `desc`, then `message`, then `REQUEST_FAILED` in its Error message.

Current adapters request the following operation names. These are implemented client methods, not proof every method is reachable from a registered command:

| Adapter source under `functions/v2/currency/` | Requested operations |
| --- | --- |
| `accounts/balances.js`, `accounts/banks.js` | `balanceCheck`, `queryBalances`, `convNameToID`, `updateBalanceAtomic`, `bankCheck`, `queryBanks`, `updateBankAtomic` |
| `accounts/multipliers.js` | `queryMulti`, `updateMulti` |
| `transactions/transfers.js` | `transferBank`, `transferBalance`, `transferItem` |
| `transactions/wagers.js` | `settleWager`, `reserveWager`, `resolveWager`; settlement defaults `requestId` with `randomUUID()` |
| `inventory/inventory.js`, `inventory/catalog.js` | `queryItem`, `queryItemName`, `updateItemAtomic`, `findItemById`, `findItemByName` |
| `inventory/purchases.js`, `inventory/lootbox.js`, `inventory/consumables.js` | `buyItem`, `openLootBox`, `getLootBox`, `consumeSushi`, `consumeMulti`, `consumeBanknotes`, `consumeLootbox` |
| `inventory/autocomplete.js` | `getItemCatalog`, `queryItem`; five-minute catalog cache and shared in-flight Promise per loaded module; validates arrays and returns at most 25 owned consumable matches |
| `progression/xp.js`, `progression/records.js` | `expGain`, `miscCheck`, `workCheck` |
| `administration/cleanup.js` | `resetCurrency`, `deleteCurrencyAccount`; `optOutCurrency()` catches failures and returns false |

Transfers send participant IDs/names and amounts/item identifiers; wagers send user identity, stake/payout as applicable, and request IDs. There is no transport retry or client guarantee of remote idempotency. See [database ownership](database.md) for transaction boundaries.

## Administration and compatibility

[`plugins/NexAPI/nexapi.js`](../plugins/NexAPI/nexapi.js) dispatches subcommands to [`functions/v2/nexapi/handlers/`](../functions/v2/nexapi/handlers/). User blacklist/whitelist and view-list handlers bypass the generic transport, use direct global fetch, require `apiServer` to equal exactly `https://api.nexint.org`, and compare the invoking user's ID with `devId`.

- `blacklist.js` / `blacklist-id.js`: POST `/api/v1/blacklist`, body `{ userId, name, completed: false, token }`.
- `whitelist.js` / `whitelist-id.js`: DELETE the same path and body shape.
- `viewlist.js`: GET that path; uses `content.blacklist` and `content.blacklistName` to build button pages.

Mutating handlers interpret status loosely equal to `"409"` as an already-present/already-removed condition and otherwise construct success text from parsed JSON, without a general HTTP success check. The ID variants fetch the Discord user before making the API request. Network/parse failures are left to the outer command handler.

Other `nexapi` subcommands are not all HTTP operations. `server-blacklist`/`server-whitelist` write the local server blacklist; the former broadcasts guild-leave actions. `invite` broadcasts creation of a one-day, single-use invite. `notify` sends a Discord DM using the local notification helper. These operations require the configured developer identity. `notifications` calls list helpers, and `add-notification` checks developer identity before calling `addNotifs`; the latter does not inspect its returned error object before presenting success.

[`nexapi/compat.js`](../functions/v2/nexapi/compat.js) supplies `embed()` through `EmbedBuilder` and a `replyEmbed()` adapter to containers for older command presentation. This is a local presentation adapter, not remote API version negotiation. `handlers/notify.js` supplies an extra fifth argument to a four-parameter `dmNotify()` function, leaving its actual fourth `override` argument null; this call does not activate the urgent override branch.

Older [`functions/v1/api/fetch.js`](../functions/v1/api/fetch.js) takes a server parameter and imports unresolved `#app-config`. It is not the current v2 transport signature. The remote NexAPI source, deployment version, authorization enforcement, response schemas beyond caller assumptions, rate limits, and persistence semantics are outside what this repository establishes.
