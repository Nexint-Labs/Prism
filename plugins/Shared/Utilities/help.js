const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { simpleMenu } = require('#functions/v2/discord/menus/pageHandler');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { botName, devMode } = require('#config/core/core');
const { devId } = require('#config/core/discord');

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Need help tinkering?')
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

		// Begin help menu
		let helpArray = [];
		if (interaction.user.id == devId) {
			helpArray.push("**Bot Owner commands:**");
			helpArray.push("- No extra commands available at the moment.");
		}

		if (devMode) {
			helpArray.push("**How to use Dev Commands:**");
			helpArray.push("- You need administrator permissions on this Discord server.");
			helpArray.push("- Make a new Discord server");
			helpArray.push(`- Invite ${botName}Bot`);
			helpArray.push("- Set your balance and go wild!");

		}

		// Currency stuff
		if (interaction.guild != null) {
			helpArray.push("**Currency commands:**");
			helpArray.push("-# These commands only work in servers or in Bot DMs.");
			helpArray.push("- /apply: Applies for a job.");
			helpArray.push("- /bal: Check balance of a user.");
			helpArray.push("- /baltop: Check the global baltop.");
			helpArray.push("- /beg: Beg for coins.");
			helpArray.push("- /cf: Coinflip a set amount of coins.");
			helpArray.push("- /deposit: Deposit money into the bank.");
			helpArray.push("- /give: Give an item to someone else.");
			helpArray.push("- /inv: View the items you have!");
			helpArray.push("- /pay: Pay someone else money.");
			helpArray.push("- /shop: Shop for items.");
			helpArray.push("- /rob: Rob people of their money.");
			helpArray.push("- /rob-toggle: Toggle if you want to steal money or not.");
			helpArray.push("- /snakeeye: Snake eyes.");
			helpArray.push("- /profile: Views a user's profile.");
			helpArray.push("- /use: Use items.");
			helpArray.push("- /withdraw: Withdraws money into the bank.");
			helpArray.push("- /work: Work for money.");
		}

		// Fun stuff
		helpArray.push("**Fun commands:**");
		helpArray.push("-Vocaloid Gifs-");
		helpArray.push("- /gif-voca: Sends a vocaloid gif");
		helpArray.push("- /miku: Sends a Miku gif.");
		helpArray.push("- /teto: Sends a Teto gif.");
		helpArray.push("- /luka: Sends a Luka gif.");
		helpArray.push("- /rin: Sends a Rin gif.");
		helpArray.push("- /len: Sends a Len gif.");
		helpArray.push("- /meiko: Sends a Meiko gif.");

		// Action Commands
		helpArray.push("-Action Gifs-");
		helpArray.push("- /action: Does an action");
		helpArray.push("- /boop: Boops someone!");
		helpArray.push("- /hug: Hugs someone!");
		helpArray.push("- /pat: Pats someone!");
		helpArray.push("- /wave: Waves towards someone!");
		helpArray.push("- /poke: Pokes someone!");
		helpArray.push("- /punch: Punches someone.");
		helpArray.push("- /kill: Self explanatory...");

		// other
		helpArray.push("-Other-");
		helpArray.push("- /8ball: 8ball.");
		helpArray.push("- /coinflip: Coinflip, without the stakes.");
		helpArray.push("- /bean: bean.");
		helpArray.push("- /minori: Small (minori) spelling mistake.");

		// Fun stuff
		helpArray.push("**Sekai commands:**");
		helpArray.push("- /gif-pjsk: Gif of a Project Sekai character.");
		helpArray.push("- /tierlb: Tierer leaderboard. Powered by seka.ing.");
		helpArray.push("- /kanade: Sends a Kanade gif.");

		// Utils
		helpArray.push("**Utility commands:**");
		helpArray.push("- /gospel: Provides the link to the Christian Gospel.");
		helpArray.push("- /help: Provides this help menu.");
		helpArray.push("- /info: Provides an info manual about the bot.");
		helpArray.push("- /notify: Opt in / out of notifications.");
		helpArray.push("- /data-opt-in: Opt in towards data collection.");
		helpArray.push("- /data-opt-out: Opt out towards data collection.");
		helpArray.push("- /ping: Checks ping of all related clusters.");
		helpArray.push("- /support: Link to our support server.");
		helpArray.push(`- /updatelog: Update log for ${botName}Bot.`);

		// Silly stuff
		helpArray.push("**Silly commands:**");
		helpArray.push("- /kana: Kana kana kanade!.");
		helpArray.push("- /mizuover: It's so Mizuover.");

		await simpleMenu(
			interaction,
			response,
			"Help Menu",
			helpArray,
			["There is no help available."],
			{
				compressed: true,
				checkNotif: false,
				advert: false
			}
		)
	},
};