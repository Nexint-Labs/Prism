const { SlashCommandBuilder } = require('discord.js');
const { client } = require('#bot');
const { botName } = require('#config/core/core');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { loadAnim } = require('#functions/v2/helpers/load');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check each shard\'s ping!')
		.setIntegrationTypes([0, 1])
		.setContexts([0, 1, 2]),
	async execute(interaction) {

		// Defer the reply to check for ping
        await loadAnim(interaction, [
            "Checking ping...",
        ], true)

		if (await checkBlacklist(interaction)) {
			return;
		}
		let ping = "";
		let results = await client.cluster.broadcastEval(client => {
			// This code runs on each individual shard
			return {
				shardId: client.cluster.id,
				ping: Math.round(client.ws.ping),
			};
		})

		// Output ping
		results.forEach(shardInfo => {
			ping = ping + `\n• Cluster #${shardInfo.shardId} | Ping: ${shardInfo.ping}ms`;
		})

		await replyContainer(
			interaction,
			"Ping",
			[
				`${botName} Ping:`,
				ping
			],
			"default",
			null,
			{
				advert: false
			}
		)
		return;
	},
};