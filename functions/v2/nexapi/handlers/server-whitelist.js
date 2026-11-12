const { embed } = require('#functions/v2/nexapi/compat');
const { blacklistServerRemove } = require('#functions/v2/auth/checkServerBlacklist');
const { devId: devID } = require('#config/core/discord');


module.exports = {
	async execute(interaction) {
		if (interaction.user.id == devID) {
			const blacklisted = await blacklistServerRemove(interaction.options.getString("id"));

			// Send reply
			let embeds = await embed("Dev Whitelist", `Whitelisted server ${interaction.options.getString("id")}.`, null, null);
			if (!blacklisted) {
				embeds = await embed("Dev Whitelist", `The server has already been whitelisted.`, null, null);
			}
			await interaction.reply({
				embeds: [embeds]
			});
		} else {

			// Send reply
			const embeds = await embed("Dev Whitelist", `You do not have permission to use this command.`, null, null)
			await interaction.reply({
				embeds: [embeds]
			});
		}
	},
};
