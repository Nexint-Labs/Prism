const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { botName } = require('#config/core/core');
const { simpleMenu } = require('#functions/v2/discord/menus/pageHandler');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('updatelog')
		.setDescription(`${botName}Bot update log.`)
		.setIntegrationTypes([0, 1])
		.setContexts([0, 1, 2]),
	async execute(interaction) {
		// Defer reply
		const response = await interaction.deferReply({
			withResponse: true,
			flags: MessageFlags.Ephemeral,
		});

        if (await checkBlacklist(interaction)) {
            return;
        }

		// Begin update log menu
		let updateInfo = [];
		updateInfo.push("**Notice:**");
		updateInfo.push("- This page will become non-maintained.");
		updateInfo.push("- Use the notification system instead!");

		// Version 0.3.1
		updateInfo.push("**Version 0.3.1:**");
		updateInfo.push("- Lootboxes");
		updateInfo.push("- bug fixes... too many... to count...");
		// Version 0.3.0
		updateInfo.push("**Version 0.3.0:**");
		updateInfo.push("- V1 system removed, in favor of V2");
		updateInfo.push("- More in-depth analytics tracking");
		updateInfo.push("- Currency tweaks");
		updateInfo.push("- Fixed negative balances");
		updateInfo.push("- Bug fixes... Many....");

		// Version 0.2.1
		updateInfo.push("**Version 0.2.1:**");
		updateInfo.push("- Added shop and items (+ related commands)");
		updateInfo.push("- New v2 help info");
		updateInfo.push("- New PFP + Banner");
		updateInfo.push("- Quality of life fixes");
		updateInfo.push("- Bugfixes");

		// Version 0.2.0
		updateInfo.push("**Version 0.2.0:**");
		updateInfo.push("- Added currency system");
		updateInfo.push("- Swapped Gif API to Klipy");
		updateInfo.push("- Opt-out support added");
		updateInfo.push("- Analytics tracking added (/info)");
		updateInfo.push("- /tierlb integrates with Seka.ing API");
		updateInfo.push("- Bugfixes");

		// Version 0.1.0
		updateInfo.push("**Version 0.1.0:**");
		updateInfo.push("- Forked from OpenBot development");
		updateInfo.push("- Added Vocaloid Gifs");
		updateInfo.push("- Added action commands");

		await simpleMenu(
			interaction,
			response,
			"Update Log",
			updateInfo,
			["There are no updates available."],
			{
				advert: false,
			}
		)
	},
};