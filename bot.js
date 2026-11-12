// Date Formatter. Used for formatting dates on logs.
// More customizable way of formatting all the bot logs at the same time.
require('dotenv').config();
const { dateOptions } = require('#config/core/core');
global.DateFormatter = new Intl.DateTimeFormat(undefined, dateOptions); // Ensures a global Date Formatter usable in any bot.

// Startup variables.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let verbose = false;

// Process arguments that change parts of how the bot works.
// --log-disable: Disables any logging functionality of the bot. Useful if saving logs take up a lot of storage.
// --safe: Enables safe mode, removes all plugins. Use this before reporting a bug with the server itself.
// --chat-log: Saves a log of every single message ever sent, or edited, in every server the bot is in. Overrides the bot status to indicate spying is enabled. Not sure if this works.
// --no-update: Disables automatic updating.
// --verbose: Gives more information in the log. This information is required when bug-reporting.
// More are to be added in the future.
let safeMode = false;
let chatLog = false;
if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Verbose mode is enabled. Additional information will be given.`);
}

if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading config files and setup variables.');
} else {
	console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading startup files and functions.`);
}
const errorFunction = function (err, origin) {
	console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Full stack trace:`);
	console.error(err);
	console.log(origin);
}
process.on('uncaughtException', async (err, origin) => {
	if (err.code == "EPIPE") {
		process.exit(0);
	}
	console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] A critical, unhandled error happened in the server software.`);
	errorFunction(err, origin);
});
process.on("unhandledRejection", async (err, origin) => {
	if (err.code == "EPIPE") {
		process.exit(0);
	}
	console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] An unhandled rejection happened.`);
	errorFunction(err, origin);
})

// Load constants and required files.
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const { spawn } = require('child_process');
const { Client, Collection, Events, ActivityType } = require('discord.js');
const { ClusterClient, getInfo, AutoResharderClusterClient } = require('discord-hybrid-sharding');
const {
    clientId,
    discordToken: token,
    intents,
    partials,
    botActivity,
    botStatus,
    botURL,
    botType
} = require('#config/core/discord');

// Get JS files Function
function getJSFiles(directory) {
	const files = [];

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === 'archive') continue;
			files.push(...getJSFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			files.push(fullPath);
		}
	}

	return files;
}

// More constants that may depend on folders existing.
const helpMenu = [];
const commands = [];
const commandList = [];
const preloadPath = path.join(__dirname, 'preload');
const pluginPath = path.join(__dirname, 'plugins');

// Load non-constants.
let count = 0;

// Update checker
const getUpdateVersion = async () => {
	try {
		if (!safeMode) {
			const update = await fetch('https://raw.githubusercontent.com/Nexints/open-bot/refs/heads/main/config.js');
			const tmp = await update.text();
			let version = 0;
			for (let i = 0; i < tmp.split("\n").length; i++) {
				if (tmp.split("\n")[i].includes("versionID")) {
					version = tmp.split("\n")[i].replace(/\D/g, "");
				}
			}
			return version;
		}
		console.log("[" + DateFormatter.format(Date.now()) + '] [WARN] Safe mode is on. Version checking will not occur.');
		return 0;
	} catch (error) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] An error happened while trying to check for updates!`);
		console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] Likely caused by the bot being unable to access Github. Full stack trace:`);
		console.error(error);
		return 0;
	}
};

if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Scanning for javascript files to preload...');
} else {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading external plugins, files, and commands.');
}
console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Be aware that I am not responsible for the actions external plugins do to modify server code.');

// Main function!
(async () => {
	// Loader code for the main server instance.
	// This jank piece of code loads commands and plugins.
	if (!safeMode) {
		for (const filePath of getJSFiles(preloadPath)) {
			const command = require(filePath);
			if ('execute' in command) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Pre-loading the file "${filePath}".`);
				}
				await command.execute();
			} else if (!(`config` in command)) {
				console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The pre-loaded file at ${filePath} is missing a required "execute" property. Nothing will be done.`);
			}
			count += 1;
		}
	}
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Found ${count} files.`);
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Making exports available.');
	}

	// Reloads slash commands
	const rest = new REST().setToken(token);
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Started reloading ${commands.length} commands.`);
	}

	// Sets up the discord client and other collections.
	const client = new Client({
		shards: getInfo().SHARD_LIST, // An array of shards that will get spawned
		shardCount: getInfo().TOTAL_SHARDS, // Total number of shards
		intents: intents,
		partials: partials
	});

	client.cluster = new ClusterClient(client);
	new AutoResharderClusterClient(client.cluster, {
		// OPTIONAL: Default is 60e3 which sends every minute the data / cluster
		sendDataIntervalMS: 60e3
	})

	let latestVersion = await getUpdateVersion();

	// Export some of the constants and functions that may be needed by other files.
	// This acts as an endpoint for other plugins to use.
	// Will be added onto more as time goes on. Endpoint APIs will most likely not be deleted unless a major revision is in order.
	module.exports = {
		helpMenu: helpMenu,
		spawn: spawn,
		chatLog: chatLog,
		client: client,
		latestVersion: latestVersion,
	}

	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Reloading all commands.');
	}

	// Scan for plugins. The command list here is used by the rest of the bot.
	if (!safeMode) {
		for (const filePath of getJSFiles(pluginPath)) {
			commandList.push(filePath);

			const command = require(filePath);

			if (command.ready) {
				await command.ready;
			}

			if ('data' in command && 'execute' in command) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Pushing the command "${command.data.name}" in "${filePath}" to JSON.`);
				}
				commands.push(command.data.toJSON());
			} else if (!('execute' in command || 'help' in command || 'command' in command || 'messageCreate' in command || 'post' in command || 'config' in command)) {
				console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The command at ${filePath} is not a valid plugin file.`);
			}

		}
	}
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Cached ${commands.length} commands.`);
	}

	// Register globally once during ordinary startup, not from every cluster.
	// For overlapping graceful reclusters, use a dedicated deployment-time
	// command registration step instead of this worker-side registration.
	let data = [];
	if (client.cluster.id === 0) {
		data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);
	}

	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Successfully reloaded ${data.length} commands.`);
	}

	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Client created.');
	}

	client.cooldowns = new Collection();
	client.commands = new Collection();

	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Scanning for files.');
	}

	count = 0;

	// Re-scan (AGAIN) for plugins.
	if (!safeMode) {
		for (let i = 0; i < commandList.length; i++) {
			count++;
			const command = await require(commandList[i]);
			if (command.ready) {
				await command.ready;
			}
			if ('data' in command && 'execute' in command) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading the command "${command.data.name}" in "${commandList[i]}".`);
				}
				client.commands.set(command.data.name, command);
			} else if ('execute' in command) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading the JS file "${commandList[i]}".`);
				}
				await command.execute();
			} else if ('help' in command) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Adding the JS file "${commandList[i]}" to the console help menu.`);
				}
				helpMenu.push(...command.help());
			} else if (!('command' in command || 'messageCreate' in command || 'post' in command || 'config' in command)) {
				console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The file at ${commandList[i]} is not a valid plugin file.`);
			}
		}
	}
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${count} files loaded.`);
	} else {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Finished loading ${count} files.`);
	}

	// Actions the bot should do when it's ready.
	// Even with the built in (custom coded) plugins, it still says the instance is modified.
	client.once(Events.ClientReady, async readyClient => {
		readyClient.cluster.triggerReady();
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Client is ready.');
		}
		if (chatLog) {
			client.user.setPresence({
				activities: [{
					name: "Bot spying Enabled! (Dev-mode)",
					type: ActivityType.Custom,
					url: botURL
				}],
				status: botStatus
			});
		} else {
			client.user.setPresence({
				activities: [{
					name: botActivity,
					type: botType,
					url: botURL
				}],
				status: botStatus
			});
		}
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Client status set. Change this in /config.js!');
		}
		asyncFunctions();

	});
	await delay(1000);

	// Login to the bot
	await client.login(token);
})();

// Parses functions that happen asyncronously when the bot finishes starting. Handles update checks, etc.
const asyncFunctions = async () => {

	if (!safeMode) {
		for (let i = 0; i < commandList.length; i++) {
			count++;
			const command = await require(commandList[i]);
			if (command.ready) {
				await command.ready;
			}
			if ('post' in command) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading the post-loaded JS file "${commandList[i]}".`);
				}
				command.post(verbose);
			}
		}
	}
}