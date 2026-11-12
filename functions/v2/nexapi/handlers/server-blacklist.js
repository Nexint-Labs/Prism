const { embed } = require('#functions/v2/nexapi/compat');
const { blacklistServerAdd } = require('#functions/v2/auth/checkServerBlacklist');
const { devId: devID } = require('#config/core/discord');
const { botName } = require('#config/core/core');
const { client } = require('#bot');


module.exports = {
	async execute(interaction) {
		if (interaction.user.id == devID) {
			const guildId = interaction.options.getString("id");
			const message = interaction.options.getString("msg");

			const guildArray = await client.cluster.broadcastEval(async (c, { guildId, message }) => {
				const guild = c.guilds.cache.get(guildId);
				if (guild) {
					const user = (await guild.fetchOwner()).user;
					try {
						guild.systemChannel.send({
							content: `This server has been blacklisted from ${botName}bot. Reason: ${message}.\nAppeal this by contacting the bot developer.\n-# This message is from the bot developer.`,
						});
					} catch { }
					guild.leave();
					return true; // Indicate that the message was sent
				}
				return false; // Indicate that the message was not sent by this shard
			}, { context: { guildId, message } }); // Pass the channelId as context

			const blacklisted = await blacklistServerAdd(interaction.options.getString("id"));

			// Send reply
			let embeds = await embed("Dev Blacklist", `Blacklisted server ${interaction.options.getString("id")}.`, null, null);
			if (!blacklisted) {
				embeds = await embed("Dev Blacklist", `The server has already been blacklisted.`, null, null);
			}
			await interaction.reply({
				embeds: [embeds]
			});
		} else {

			// Send reply
			const embeds = await embed("Dev Blacklist", `You do not have permission to use this command.`, null, null)
			await interaction.reply({
				embeds: [embeds]
			});
		}
	},
};
