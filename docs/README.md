# Prism implementation documentation

These documents describe the checked-out source through static inspection on November 12, 2026. Paths resolve relative to this repository. No application modules were imported or executed, services contacted, database contents inspected, or tests/builds run. Descriptions of requests and startup side effects describe code paths, not observed runtime results.

| Document | Contents |
| --- | --- |
| [Architecture](architecture.md) | Manager, workers, startup, shared helpers, event flows |
| [Plugin system](plugins.md) | Discovery, exports, registration, reload limitations |
| [Commands](commands.md) | Discord declarations, interaction dispatch, console commands |
| [Configuration](configuration.md) | Configuration modules, environment variables, guild settings |
| [Database integration](database.md) | SQLite model definitions, initialization, ownership |
| [NexAPI integration](nexapi.md) | Clients, endpoints, calling conventions, errors |
| [Versioning](versioning.md) | Framework/deployment/package versions, update checks |
| [Deployment behavior](deployment.md) | Existing launch scripts, processes, side effects, shutdown |

The implementation is the authority where comments, help text, and older documentation differ. In particular, files under `plugins/Testing/` are discoverable by the worker; older files outside the loader roots are not automatically activated merely because they exist. Each document identifies supporting source paths and relevant functions. No operational deployment, external API behavior, or compatibility guarantee follows from this static review.
