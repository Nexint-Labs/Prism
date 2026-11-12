// dotenv loader
// This is required.
require('dotenv').config();

// Date Formatter. Used for formatting dates on logs.
// More customizable way of formatting all the bot logs at the same time.
const { dateOptions, logFormat, botName } = require('#config/core/core');
global.DateFormatter = new Intl.DateTimeFormat(undefined, dateOptions); // Ensures a global Date Formatter usable in any bot.
console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Starting up...');

// Startup variables.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let verbose = false;
const startDate = Date.now(); // tracks current date lol

// Catches uncaught exceptions and puts them towards the regular event handler.
// This likely happens when there is a serious error with the bot in either its shutdown or startup procedures.
// This is put close to first for priority reasons.
const errorFunction = function (err, origin) {
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Full stack trace:`);
		console.error(err);
		console.log(origin);
	} else {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Shortened error / origin: ${err}, ${origin}.`);
	}
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

// Process arguments that change parts of how the bot works.
// --log-disable: Disables any logging functionality of the bot. Useful if saving logs take up a lot of storage.
// --safe: Enables safe mode, removes all plugins. Use this before reporting a bug with the server itself.
// --chat-log: Saves a log of every single message ever sent, or edited, in every server the bot is in. Overrides the bot status to indicate spying is enabled. Not sure if this works.
// --no-update: Disables automatic updating.
// --verbose: Gives more information in the log. This information is required when bug-reporting.
// More are to be added in the future.
let logging = true;
let safeMode = false;
let chatLog = false;
let autoUpdate = true;
process.argv.forEach(function (val, index, array) {
	switch (val) {
		case '--log-disable':
			logging = false;
			break;
		case '--safe':
			safeMode = true;
			verbose = true;
			autoUpdate = false;
			break;
		case '--chat-log':
			chatLog = true;
			break;
		case '--no-update':
			autoUpdate = false;
			break;
		case '--verbose':
			verbose = true;
			break;
	}
});
if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Verbose mode is enabled. Additional information will be given.`);
}

if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading config files and setup variables.');
} else {
	console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading startup files and functions.`);
}

// Discord bot code (manager)
// These lines of code dictate how the bot works.

// Load constants and required files.
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { REST, Routes } = require('discord.js');
const { spawn } = require('child_process');
const { Client, Collection, Events, ActivityType } = require('discord.js');

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

const { version, versionID, fileCount } = require('#config/core/update');
const fetch = (url, init) => import('node-fetch').then(module => module.default(url, init));

try {
	process.chdir(__dirname);
	console.log(`New directory: ${process.cwd()}`);
} catch (err) {
	console.error(`Error changing directory: ${err}`);
}

// Create files if they don't exist.
var dirs = ['./logs', './plugins', './preload'];
for (let i = 0; i < dirs.length; i++) {
	if (!fs.existsSync(dirs[i])) {
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Creating folder ${dirs[i]}.`);
		}
		fs.mkdirSync(dirs[i]);
	}
}

// More constants that may depend on folders existing.
const helpMenu = [];
const commands = [];
const commandList = [];
const preloadPath = path.join(__dirname, 'console');
const preloadFolders = fs.readdirSync(preloadPath);

// Prepares dependancy functions.
const rl = readline.createInterface({
	input: process.stdin,
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));
const originalWrite = process.stdout.write;

// Load non-constants.
consoleOpen = true; // global consoleOpen variable, checked constantly
let count = 0;
let latestVersion = 0;

// Set up the log. This is only done if logging is on.
let outputFileStream;
if (logging) {
	outputFileStream = fs.createWriteStream(`logs/${logFormat}.txt`, { 'flags': 'a' });
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Setting up the log.');
	}
	outputFileStream.write(`-----------------Info-------------------\n`);
	outputFileStream.write(`|  These logs are for debug purposes.  |\n`);
	outputFileStream.write(`|    Logging is optional with args.    |\n`);
	outputFileStream.write(`|    Logs are turned on by default.    |\n`);
	outputFileStream.write(`----------------------------------------\n`);

	// Override the logging function to log to a file. Done for outputs and errors.
	process.stdout.write = function () {
		const result = originalWrite.apply(process.stdout, arguments);
		outputFileStream.write.apply(outputFileStream, arguments);
		return result;
	};
	process.stderr.write = function () {
		const result = originalWrite.apply(process.stderr, arguments);
		outputFileStream.write.apply(outputFileStream, arguments);
		return result;
	};
} else {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Logging has been disabled.');
}

if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading error handlers and other functions.');
}

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
const updateCheck = () => {
	if (versionID < latestVersion) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You're running an outdated version of this bot! (You are ${latestVersion - versionID} commits behind)`);
		console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `Update now at https://github.com/Nexints/open-bot to make sure that your bot has the latest security fixes!`);
		if ((latestVersion - versionID) >= 5) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You are over 5 commits behind. Update to the latest version as soon as possible.`);
		}
	} else if (latestVersion == 0) {
		if (!safeMode) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `I can't check for updates!`);
			console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `This may lead to unknown errors. Here be dragons!`);
		}
	} else if (versionID > latestVersion) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You're running an experimental version of this bot! (You are ${versionID - latestVersion} commits ahead)`);
		console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `Here be dragons!`);
	} else {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `You're running the latest version of this bot!`);
	}
}

// Instantiate error catchers and shutdown functions
// Handles the shutdown process after ending the bot execution
const exitHandler = async function () {
	consoleOpen = false;
	(async () => {
		// Console output is already logged, just needs time to log to a file.
		// Arbitrary delay(?)
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Logging the console output.');
		await delay(1000);
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Ending process.');
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', '\x1b[36m--------------------- Nex 2025 ---------------------\x1b[0m');
		process.exit(0);
	})();
}
console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading console commands...');

// Web server code (uses expressJS)
// This part of code makes sure that the backend website works.

// Import expressJS
const express = require('express');
const { port } = require('#config/core/api');
const app = express()

// Backend #1 (describe whats going on)
app.get('/', (req, res) => {
	res.json({
		name: "Backend",
		description: "This is the backend for MikuBot.",
		content: null,
		refreshDate: Date.now(),
	})
})
app.get('/status', (req, res) => {
	res.json({
		name: "Status",
		description: "The status page of Mikubot.",
		content: {
			// 0 means offline, 1 means online
			status: 1,

		},
		refreshDate: Date.now(),
	})
})

// Main function!
const main = async () => {
	// Loader code for the main server instance.
	latestVersion = await getUpdateVersion();
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Making exports available.');
	}

	// Hosts the server
	const server = app.listen(port, () => {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${botName} listening on port ${port}`)
	})

	// Export some of the constants and functions that may be needed by other files.
	// This acts as an endpoint for other plugins to use.
	// Will be added onto more as time goes on. Endpoint APIs will most likely not be deleted unless a major revision is in order.
	module.exports = {
		server: server,
		helpMenu: helpMenu,
		readline: rl,
		spawn: spawn,
		exitHandler,
		chatLog: chatLog,
		latestVersion: latestVersion,
	}

	// More constants that may depend on folders existing.

	if (!safeMode) {
		for (const folder of preloadFolders) {
			const commandsPath = path.join(preloadPath, folder);
			const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				commandList.push(filePath);
				const command = await require(filePath);
				if (command.ready) {
					await command.ready;
				}
				if ('execute' in command) {
					await command.execute();
				} else if ('help' in command) {
					helpMenu.push(...command.help());
				}
			}
		}
	}

	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Starting shards.');
	}

	// Scan for plugins. The command list here is used by the rest of the bot.

	const { ClusterManager, AutoResharderManager, ReClusterManager } = require('discord-hybrid-sharding');

	const manager = new ClusterManager(`${__dirname}/bot.js`, {
		totalShards: 'auto', // or numeric shard count
		/// Check below for more options
		shardsPerClusters: 2, // 2 shards per process
		// totalClusters: 7,
		mode: 'process', // you can also choose "worker"
		token: token,
	});

	manager.extend(
		new ReClusterManager()
	)

	manager.extend(
		new AutoResharderManager(this.cluster, {
			/* If you need a debug information*/
			debug: true,
			/* how many shards per cluster should be spawned */
			ShardsPerCluster: 'useManagerOption', // or a specific number

			/* minimum amount of guilds each shard should contain */
			MinGuildsPerShard: 1400, // or auto

			/* maximum amount of guilds each shard should contain -> if exceeded it auto. "re-shards" the bot */
			MaxGuildsPerShard: 2400,

			/* OPTIONAL: RestartOptions which should be used for the ClusterManager */
			restartOptions: {
				/** The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed  */
				restartMode: 'gracefulSwitch', // or 'gracefulSwitch
				/** The delay to wait between each cluster spawn */
				delay: 7e3, // any number > 0 | above 7 prevents api ratelimit
				/** The readyTimeout to wait until the cluster spawn promise is rejected */
				timeout: -1,
			}
		})
	);

	manager.on('clusterCreate', cluster => console.log(`Launched Cluster ${cluster.id}`));

	manager
		.spawn({ timeout: -1 })
		.then((shards) => {
			if (verbose) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Shard is ready.');
			}

			// Logs the custom startup message.
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', '\x1b[36m----------------------------------------------------\x1b[0m');
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "              Welcome to Nexint's bot!              ");
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "           You are running version: " + version);
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "       Stay up to date for the best features.       ");
			if (safeMode) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "        Stop the bot by killing the process.        ");
			} else {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "             Modify the bot with /help!             ");
			}
			if (count > 0 && count != fileCount) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `             This instance is modified.             `);
			} else if (safeMode) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `                 Safe mode enabled.                 `);
			}
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', '\x1b[36m----------------------------------------------------\x1b[0m');
			console.log("Bot is running.");

			// Version checking.
			if (count > 0 && count != fileCount) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `Due to this instance being modified, update checking will not happen.`);
			} else {
				updateCheck();
			}
			+			manager.broadcastEval(c => ({ username: c.user?.username, discriminator: c.user?.discriminator }))
				.then(usernames => {
					// The result is an array of usernames from each shard
					// Since the username is the same for all shards, you can take the first one
					const botUsername = usernames[0].username + "#" + usernames[0].discriminator;
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Done! Logged into ${botUsername} in ${(Date.now() - startDate) / 1000} seconds.`);
				})

			// Startup options.
			if (safeMode) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Zero plugins or pre-loaded files are being used, verbose mode is enabled, and logging is disabled.`);
			}
			if (verbose) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Verbose mode is enabled. Additional information will be given.`);
			} else {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Verbose mode is disabled. Verbose mode needs to be enabled to report bugs.`);
			}
			asyncFunctions();
		});

};

main();

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
	commandParser();
	if (autoUpdate) {
		autoUpdateCheck();
	} else {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Automatic update checking disabled.');
	}
}

// Command Parser - parses the commands, and the main part of the console.
const commandParser = async () => {
	while (consoleOpen) {
		const command = await prompt('');
		if (logging) {
			outputFileStream.write(command + '\n');
		}
		let validCommand = false;
		for (let i = 0; i < commandList.length; i++) {
			const cmd = require(commandList[i]);
			if ('command' in cmd) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading the commands in "${commandList[i]}".`);
				}
				validCommand = await cmd.command(command);
				if (validCommand) {
					i = commandList.length; // Skip processing more commands if one is valid. Saves time.
				}
			}
		}
		if (validCommand == false) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] This command is not a valid command.');
		}
	}
}

// Update checks - Asyncronously checks updates.
const autoUpdateCheck = async () => {
	if (count == 0 || count == fileCount) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Automatic update checking enabled');
		while (consoleOpen) {
			await delay(3600000); // artificial delay to ensure host's CPU doesn't die
			latestVersion = await getUpdateVersion();
			updateCheck();
		}
	}
}