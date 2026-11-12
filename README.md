# Prism

**The Next Level Discord Bot!**
Prism is an open-source, modular Discord bot built using Node.js and Discord.js. It supports a variety of commands, utilities, moderation tools, and integrations with NexAPI.

Originally built on OpenBot, Prism now uses a modular configuration system and shared command architecture.

## Features

- **GIF Commands:** GIFs from various fandoms, powered by external APIs.
- **Action Commands:** Interact with other users using commands such as `/action`, including hugs, pats, fights, and more.
- **Silly Commands:** Fun commands including `/mizuover` and `/minori`.
- **Currency System:** Economy commands including `/blackjack` and `/coinflip`.
- **Moderation:** Tools for server administration and management.
- **NexAPI Integration:** Shared backend services for notifications, user management, and other functionality.
- **Modular Architecture:** Separate configuration files, shared utilities, and plugin-based commands.

## Current Deployments

Prism and its related codebase are deployed across several Discord applications:

- Miku#0100
- Teto#4311
- Neru#7016
- NexAPI Manager#4213
- Prism#8911

Feature availability may differ between deployments.

## AI Disclosure

Prism was developed with the assistance of AI. However, I independently reviewed the current v2 release and made sure the code is suitable for public release.

I wrote the majority of the bot's original foundation myself. ChatGPT primarily assisted with migrations, debugging, code reviews, and architectural improvements.

Some commands were developed almost entirely with AI assistance, but the vast majority of the codebase remains minimally AI-assisted.

Documentation does not exist, but may be generated with Codex.

## Prerequisites

- Node.js and npm
- A stable internet connection
- A Discord application and bot token
- API credentials for optional integrations

## Installation

1. Download or clone this repository.
2. Extract the files into a separate folder.
3. Install Node.js and npm if you have not already.
4. Open a terminal in the project directory.
5. Install dependencies:

   ```bash
   npm install
   ```

6. Create a Discord application at [Discord Developer Portal](https://discord.com/developers/applications).
7. Create a `.env` file in the project root and configure the required environment variables.
8. Review the configuration files inside the `config/` directory.
9. Start the bot:

   ```bash
   npm start
   ```

   Alternatively, run `node index.js` or use `start.bat` on Windows.

**Note:** Some functionality requires NexAPI, Redis, SQLite databases, or third-party API credentials. The required services depend on which plugins are enabled.

## Configuration

Prism uses a modular configuration system to make configuration easier!

Configuration files are organized into directories such as:

```text
config/
├── api/
├── core/
├── fun/
├── mod/
└── visual/
```

Sensitive credentials should be stored in environment variables
(an example is provided in [`.env.example`](./.env.example))
rather than committed to the repository.

**Never publish your `.env` file, Discord bot token, or production database files.**

## FAQ

**Error: Used Disallowed Intents**

Enable the required privileged gateway intents in the Discord Developer Portal under your application's Bot settings. Make sure they match the intents configured by Prism. Some privileged intents require Discord approval for eligible verified bots.

**Do I need a Guild ID?**

A Guild ID is optional for configurations that do not use guild-specific features.

**What is the Client ID?**

The Client ID is your Discord application's Application ID.

**Do I need a GIF API key?**

Klipy-powered GIF features require a valid Klipy API key. Without one, affected GIF commands may not function correctly.

The legacy Tenor integration is deprecated.

## Notes

- Prism supports modular plugins and shared utility functions.
- Some legacy commands have been consolidated into modern command groups.
- The compatibility deployment may retain older commands.
- The project is undergoing ongoing modernization, including Discord Components V2 migration.
- API-dependent features may require separately deployed backend services.

## Copyright / Bot Issues

This project is open-source. Usage is governed by the applicable project license first and my Nex TOS: [https://nexint.ca/tos](https://nexint.ca/tos) otherwise.

Prism is built on OpenBot, another project I own:

[https://github.com/Nexints/open-bot](https://github.com/Nexints/open-bot)

Copyright © Nexint. All rights reserved where applicable.