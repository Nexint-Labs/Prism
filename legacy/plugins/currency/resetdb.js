/*

Archived due to why does this exist?

Bro this can be managed on the backend's side, not here

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { reset } = require('#functions/currency/administration/cleanup');
const { devMode, devID } = require('#app-config');
const { replyEmbed } = require('#functions/general/replyEmbed');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('resetdb')
		.setDescription('Resets the database (dev only). Only possible when dev mode is enabled.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.deferReply();
		if (!devMode) {
			await interaction.editReply({
				content: "Dev mode is turned off. This command does not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (interaction.user.id != devID) {
			await interaction.editReply({
				content: "You are not the developer of this bot. This incident will be reported.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		await reset();
		let msg = `Reset the entire database.`;
		await interaction.editReply({
			content: msg
		});
	},
};

*/