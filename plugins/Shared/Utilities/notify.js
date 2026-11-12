const { SlashCommandBuilder } = require('discord.js');
const { notify } = require("#preload/dbs/funDBs");
const { loadAnim } = require('#functions/v2/helpers/load');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('notify')
		.setDescription('Toggle notifications.')
		.addStringOption(option =>
			option
				.setName('disable')
				.setDescription('Opt out of notifications?')
				.setRequired(true)
				.addChoices(
					{ name: 'Yes', value: 'true' },
					{ name: 'No', value: 'false' },
				)),
	async execute(interaction) {

		// Notify Toggle
		await loadAnim(interaction, [
			"Toggling Notifications...",
		], true)

		if (await checkBlacklist(interaction)) {
			return;
		}
		let msg = "";
		switch (interaction.options.getString("disable")) {
			case "true":
				try {
					await notify.create({
						userId: interaction.user.id,
					});
				} catch (error) {
					if (error.name === 'SequelizeUniqueConstraintError') {
						await replyContainer(
							interaction,
							"Notify",
							["Already opted out."],
							"warn",
							warning,
							{
								advert: false
							}
						)
						return
					}
					throw error;
				}
				msg = '❌ You have opted out of notifications.'
				break;
			case "false":
				const rowCount = await notify.destroy({ where: { userId: interaction.user.id } })
				if (!rowCount) {
					await replyContainer(
						interaction,
						"Notify",
						["Already opted in."],
						"warn",
						warning,
						{
							advert: false
						}
					)
					return
				}
				msg = '✅ You have opted into notifications.'
				break;
		}
		await replyContainer(
			interaction,
			"Notify",
			[msg],
			"default",
			null,
			{
				advert: false
			}
		)
		return;
	},
};