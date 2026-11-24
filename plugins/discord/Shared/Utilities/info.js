const { SlashCommandBuilder } = require('discord.js');

// Query
const { queryCommand, queryAllUsers, queryCmds } = require('#functions/discord/analytics/usageData');
const { getLeaderboard } = require('#functions/discord/currency/userInfo');

// Helpers
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');

// config
const { frameName, frameVer, frameID } = require('#config/core/core');
const { loadAnim } = require('#functions/discord/helpers/load');
const { pluginName, pluginVer } = require('#config/cosmetic/config');
const { getUpdateVersion } = require('#functions/core/update');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription(`Info about ${pluginName}bot!`)
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

		let latestVersion = await getUpdateVersion();

		// bot version
		let outputMsg;
		if (latestVersion > frameID) {
			outputMsg = `${latestVersion - frameID} commits behind.`;
		} else if (latestVersion == 0) {
			outputMsg = `The bot can't check for updates!`;
		} else if (latestVersion < frameID) {
			outputMsg = `${frameID - latestVersion} commits ahead.`;
		} else {
			outputMsg = `Running the latest version.`;
		}

		// build variables
		let guilds = await interaction.client.cluster.broadcastEval(`this.guilds.cache.size`);
		let members = await interaction.client.cluster.broadcastEval((c) => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
		const lb = await getLeaderboard();
		let commands = await queryCommand();
		let totalMembers = await queryAllUsers();
		let balances = lb.content.balance
		let banks = lb.content.bank
		let cmdsDay = await queryCmds("day");
		let shardGuilds = interaction.client.guilds.cache.size;

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
			if ((Date.now() - user.lastUsed) / (60 * 60 * 24 * 1000) < 14) {
				activeUsers += 1;
				realCommands += user.value;
			}
		});

		// begin message
		let msg = "";
		msg += `${pluginName} runs as a complex Discord Bot connected to a centralized Nexint API!\n\n`;

		// bot version
		let ver = ""
		ver += `**Bot Version:**\n`;
		ver += `${pluginName} Version: ${pluginVer} (More development to come!)\n`
		ver += `${frameName} version: ${frameVer} (Version ID: ${frameID}) / Latest version ID: ${latestVersion}.\n${outputMsg}\n\n`;

		// curency stats
		let bal = ""
		bal += `**Currency Stats:**\n`;
		bal += `Currency Members: ${balances.length} (${banks.length} bank accounts)\n`;
		bal += `Total Balance: ${(abbrevBalance(totalBalance)).displayValue}\n`;
		bal += `Total Banks: ${(abbrevBalance(totalBank)).displayValue}\n`;
		bal += `Total Net (excl. items): ${(abbrevBalance(totalBalance + totalBank)).displayValue}\n\n`;

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