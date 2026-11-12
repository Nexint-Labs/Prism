const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { loadAnim } = require('#functions/v2/helpers/load');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Info about this specific server!'),
	async execute(interaction) {

		// Defer the reply to check for stuff
        await loadAnim(interaction, [
            "Loading server info...",
        ], true)

        if (await checkBlacklist(interaction)) {
            return;
        }

		try {
			// Output stats
			// Fetch the specific guild
			const guild = interaction.guild;

			// Get the member count
			const memberCount = guild.memberCount;

			// owner
			const owner = await guild.fetchOwner();

			// define msg
			let msg = "";
			msg = msg + `Total Members: ${memberCount}\n`;
			msg = msg + `Owner: ${owner.displayName} (${owner.user.username} / ${owner.id})\n`;
			msg = msg + `Locale: ${guild.preferredLocale}\n`;
			msg = msg + `Max members: ${guild.maximumMembers}\n`;
			msg = msg + `ID: ${guild.id}\n`;
			msg = msg + `Your join date: <t:${Math.round(guild.joinedTimestamp / 1000)}:R>\n`;
			msg = msg + `Guild creation date: <t:${Math.round(guild.createdTimestamp / 1000)}:R>\n`;
			msg = msg + `Large?: ${guild.large}\n`;

			// embed and return
			await replyContainer(
				interaction,
				"Server Info",
				[
					msg
				],
				"default",
				null,
				{
					advert: false
				}
			)

		} catch (error) {

			await replyContainer(
				interaction,
				"Server Info",
				[
					"This bot is not added to this server, meaning this bot can't access server data.",
					`Error code: ${error}`
				],
				"warn",
				warning,
				{
					advert: false
				}
			)

		}
		return;
	},
};