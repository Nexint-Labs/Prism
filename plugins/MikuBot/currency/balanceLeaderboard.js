const { SlashCommandBuilder } = require('discord.js');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { queryBalances } = require('#functions/v2/currency/accounts/balances');
const { queryBanks } = require('#functions/v2/currency/accounts/banks');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { simpleMenu } = require('#functions/v2/discord/menus/pageHandler');

module.exports = {
	cooldown: 5,

	data: new SlashCommandBuilder()
		.setName('baltop')
		.setDescription('Views balance of the top people, globally.')
		.addStringOption(option =>
			option.setName('leaderboard')
				.setDescription('The leaderboard to view.')
				.setRequired(true)
				.addChoices(
					{ name: 'Wallet', value: 'Wallet' },
					{ name: 'Bank', value: 'Bank' }
				)
		),

	async execute(interaction) {
		// Defer reply
		const response = await interaction.deferReply({
			withResponse: true
		});

		// Blacklist check
		if (await checkBlacklist(interaction)) {
			return;
		}

		// Leaderboard settings
		const leaderboard = interaction.options.getString('leaderboard');
		const maxEntries = 1000;

		// Get leaderboard data
		const getLeaderboard = async function () {
			let data;

			switch (leaderboard) {
				case 'Wallet':
					data = await queryBalances();
					break;

				case 'Bank':
					data = await queryBanks();
					break;
			}

			// Sort by balance (highest first)
			data.sort((person1, person2) => person2.value - person1.value);

			// Get top entries
			const top = [];

			for (let i = 0; i < Math.min(maxEntries, data.length); i++) {
				top.push(data[i]);
			}

			return top;
		};

		// Build leaderboard messages
		const buildLeaderboard = async function () {
			const data = await getLeaderboard();
			const messages = [];

			for (let i = 0; i < data.length; i++) {
				const user = data[i];
				const coins = await abbrevBalance(user.value);

				messages.push(
					`**#${i + 1}** · \`${user.name}\` — ${coins.displayValue} coins`
				);
			}

			return messages;
		};

		// Generate leaderboard
		const messages = await buildLeaderboard();

		// Display paginated leaderboard
		await simpleMenu(
			interaction,
			response,
			`${leaderboard} leaderboard`,
			messages,
			['No leaderboard at the moment for this category.'],
			{
				compressed: true,
				checkNotif: true,
				advert: false,
				copyright: true
			}
		);
	}
};