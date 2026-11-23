const { SlashCommandBuilder } = require('discord.js');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { loadAnim } = require('#functions/discord/helpers/load');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { pluginName } = require('#config/cosmetic/config');

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
		let results = await interaction.client.cluster.broadcastEval(client => {
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
				`${pluginName} Ping:`,
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