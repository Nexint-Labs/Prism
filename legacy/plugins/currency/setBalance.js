/*

Archived for legacy dev command.

Bro just use the API-

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('#functions/optOutIntChk');
const { balanceCheck, updateBalanceAtomic } = require('#functions/currency/accounts/balances');
const { abbrevBalance } = require('#functions/abbrevValues');
const { addCommandsUsed } = require('#functions/usageData');
const { devMode, devMsg, devID } = require('#app-config');
const { replyEmbed } = require('#functions/general/replyEmbed');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('setbal')
		.setDescription('Sets the balance of a specific user. Dev only.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The person\'s balance to reset. Defaults to yourself.'))
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount. Defaults to 0.'))
		.addIntegerOption(option =>
			option
				.setName('zeros')
				.setDescription('The amount of zeroes behind.'))
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
		if (interaction.user.id != devID && false) { // turning off the gatekeep
			await interaction.editReply({
				content: "You are not the developer of this bot. This incident will be reported.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let guildMember = interaction.options.getUser("user");
		if (guildMember === null) {
			guildMember = interaction.user
		}
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "This person is opted out. Balance checks will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let balanceUser = await balanceCheck(guildMember);
		
		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (!Number.isFinite(transfer) || transfer < 0) throw new Error('INVALID_BALANCE');
        await updateBalanceAtomic(guildMember, transfer - balanceUser.value);
		transfer = await abbrevBalance(transfer);
		let msg = `Set ${balanceUser.name}'s balance to ${transfer.displayValue} coins.`;
		if (guildMember.id == interaction.user.id) {
			msg = `Set your balance to ${transfer.displayValue} coins.`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		addCommandsUsed(interaction.user);
		await interaction.editReply({
			content: msg
		});
	},
};

*/