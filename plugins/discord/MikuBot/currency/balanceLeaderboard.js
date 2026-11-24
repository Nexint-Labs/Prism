const { SlashCommandBuilder } = require('discord.js');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { simpleMenu } = require('#functions/discord/container/menus/pageHandler');
const { getAPI, queryAPI } = require('#functions/discord/api/fetch');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { prefix } = require('#functions/discord/core/pluralValues');

module.exports = {
	cooldown: 5,

	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription(`Views the leaderboard of the top people on economy.`)
		.addStringOption(option =>
			option.setName('leaderboard')
				.setDescription('The leaderboard to view.')
				.setRequired(true)
				.addChoices(
					{ name: 'Wallet', value: 'Wallet' },
					{ name: 'Bank', value: 'Bank' },
					{ name: 'Jobs', value: 'Jobs' },
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

		let field;

		// Get leaderboard data
		const getLeaderboard = async function () {

			const request = await queryAPI("/currency", {
				depth: 1000
			})
			if (request.error) {
				await replyContainer(
					interaction,
					"API Error",
					["Could not query."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return null;
			}
			let data;

			switch (leaderboard) {
				case 'Wallet':
					data = request.content.balance
					field = "value"
					break;

				case 'Bank':
					data = request.content.bank
					field = "value"
					break;

				case "Jobs":
					data = request.content.jobs
					field = "wage"
					break;
			}

			data.sort((a, b) => b[field] - a[field]);

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
			if (!data) return null
			const messages = [];

			for (let i = 0; i < data.length; i++) {
				const user = data[i];
				let value = user.value;
				if(value === undefined){
					value = user.wage
				}
				const coins = abbrevBalance(value);

				messages.push(`**#${i + 1}** · \`${user.name}\` - ${coins.displayValue} ${prefix(coins.value)}`);
			}

			return messages;
		};

		// Generate leaderboard
		const messages = await buildLeaderboard();

		if (!messages) return null

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