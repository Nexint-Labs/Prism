const { SlashCommandBuilder } = require('discord.js');

// Query
const { queryCommand, queryAllUsers, queryCmds } = require('#functions/v2/analytics/usageData');
const { queryBalances } = require('#functions/v2/currency/accounts/balances');
const { queryBanks } = require('#functions/v2/currency/accounts/banks');

// Helpers
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

// config
const { version, versionID, mikuVer, mikuChannel } = require('#config/core/update');
const { botName } = require('#config/core/core');
const { client, latestVersion } = require('#bot');
const { loadAnim } = require('#functions/v2/helpers/load');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription(`Info about ${botName}bot!`)
		.setIntegrationTypes([0, 1])
		.setContexts([0, 1, 2]),
	async execute(interaction) {
		// Defer reply
		await loadAnim(interaction, [
			"Loading relevant info... This may take a while."
		], true)

        if (await checkBlacklist(interaction)) {
            return;
        }
		
		// bot version
		let outputMsg;
		if (latestVersion > versionID) {
			outputMsg = `${latestVersion - versionID} commits behind.`;
		} else if (latestVersion == 0) {
			outputMsg = `The bot can't check for updates!`;
		} else if (latestVersion < versionID) {
			outputMsg = `${versionID - latestVersion} commits ahead.`;
		} else {
			outputMsg = `Running the latest version.`;
		}

		// build variables
		let guilds = await client.cluster.broadcastEval(`this.guilds.cache.size`);
		let members = await client.cluster.broadcastEval((c) => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
		let commands = await queryCommand();
		let totalMembers = await queryAllUsers();
		let balances = await queryBalances();
		let banks = await queryBanks();
		let cmdsDay = await queryCmds("day");
		let shardGuilds = client.guilds.cache.size;

		// setup balances
		let totalBalance = 0;
		let totalBank = 0;
		let activeUsers = 0;
		let realCommands = 0;

		// find balances, etc
		await balances.forEach(async (balance) => {
			if (balance.value >= 0) {
				totalBalance += balance.value;
			}
		});
		await banks.forEach((bank) => {
			if (bank.value >= 0) {
				totalBank += bank.value;
			}
		});
		await totalMembers.forEach(async (user) => {
			if ((Date.now() - user.lastUsed) / (60*60*24 * 1000) < 14) {
				activeUsers += 1;
				realCommands += user.value;
			}
		});

		// begin message
		let msg = "";
		msg += `${botName} runs as a complex Discord Bot connected to a centralized Nexint API!\n\n`;

		// bot version
		let ver = ""
		ver += `**Bot Version:**\n`;
		ver += `${botName} Version: ${mikuVer}-${mikuChannel} (More development to come!)\n`
		ver += `OpenBot version: ${version} (Version ID: ${versionID}) / Latest version ID: ${latestVersion}.\n${outputMsg}\n\n`;

		// curency stats
		let bal = ""
		bal += `**Currency Stats:**\n`;
		bal += `Currency Members: ${balances.length} (${banks.length} bank accounts)\n`;
		bal += `Total Balance: ${(await abbrevBalance(totalBalance)).displayValue}\n`;
		bal += `Total Banks: ${(await abbrevBalance(totalBank)).displayValue}\n`;
		bal += `Total Net (excl. items): ${(await abbrevBalance(totalBalance + totalBank)).displayValue}\n\n`;

		// stats
		let stats = ""
		stats += `**Bot Stats:**\n`;
		stats += `Members: ${members}\n`;
		stats += `Guilds: ${guilds.reduce((prev, val) => prev + val, 0)}\n`
		stats += `Current Shard Guilds: ${shardGuilds}\n`;
		stats += `"Real" members: ${totalMembers.length}\n`;
		stats += `Active members (14d): ${activeUsers}\n`;
		stats += `Total commands used: ${commands.value}\n`;
		stats += `Real commands used: ${realCommands}\n`;
		stats += `Commands used (past day): ${cmdsDay}\n`;

		// Reply
		await replyContainer(
			interaction,
			"Info",
			[msg, ver, bal, stats],
			"default",
			null,
			{
				checkNotif: false,
				advert: false,
			}
		)
		return;
	},
};