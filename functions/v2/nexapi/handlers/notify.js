const { embed } = require('#functions/v2/nexapi/compat');
const { dmNotify } = require('#functions/v2/notify/dmNotify');
const { devId: devID } = require('#config/core/discord');


module.exports = {
	async execute(interaction) {
		if (interaction.user.id == devID) {
			let msg = interaction.options.getString("msg");

			// Send reply
			const embeds = await embed("Dev Notify", `DMed ${interaction.options.getUser("user").displayName} "${msg}".`, null, null)
			await interaction.reply({
				embeds: [embeds]
			});

			// DM Notify (as a test)
			let result = await dmNotify(interaction.options.getUser("user"), [`${msg} \n-# This message is from the bot developer.`], null, null, true);
			if (result !== 0 && result?.rawError?.message != "Cannot send messages to this user") {
				console.log(result);
			}
		} else {

			// Send reply
			const embeds = await embed("Dev Notify", `You do not have permission to use this command.`, null, null)
			await interaction.reply({
				embeds: [embeds]
			});
		}
	},
};
