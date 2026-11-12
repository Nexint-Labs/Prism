const { SlashCommandBuilder } = require('discord.js');
const { queryItem } = require('#functions/v2/currency/inventory/inventory');
const { convItem } = require('#functions/v2/currency/inventory/catalog');
const { convNameToID } = require('#functions/v2/currency/accounts/balances');
const { queryUser, addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { balanceCheck } = require('#functions/v2/currency/accounts/balances');
const { bankCheck } = require('#functions/v2/currency/accounts/banks');
const { miscCheck, workCheck } = require('#functions/v2/currency/progression/records');
const { request } = require('#functions/v2/currency/apiRead');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { createAdvancedContainer } = require('#functions/v2/discord/container');
const { short } = require('#functions/v2/discord/menus/short');
const { abbrevBalance } = require('#functions/v2/helpers/abbrevValues');
const { getUser } = require('#functions/v2/discord/shardInfo');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Views the profile of anyone.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The person\'s profile to check. Defaults to yourself.'))
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('The person\'s profile to check by name. Overridden by user.'))
		.addStringOption(option =>
			option
				.setName('id')
				.setDescription('The person\'s profile to check. Overridden by user.')),
	async execute(interaction) {

		// defer
		const response = await interaction.deferReply({
			withResponse: true,
		});

		if (await checkBlacklist(interaction)) {
			return;
		}

		// Get current user
		let guildMember = interaction.options.getUser("user");
		if (guildMember === null) {
			let userID = interaction.options.getString("id");
			if (interaction.options.getString("name") !== null && userID === null) {
				userID = await convNameToID(interaction.options.getString("name"));
			}
			if (userID != null) {
				guildMember = await getUser(userID);
			} else if (interaction.options.getString("name") === null) {
				guildMember = interaction.user;
			}
			if (guildMember == null) {
				await replyContainer(
					interaction,
					"Profile",
					["This target does not exist."],
					"warn",
					warning,
					{
						advert: false
					}
				)
				return
			}
		}

		// check for opt out

		if (await optOutChkSingle(guildMember)) {
			await replyContainer(
				interaction,
				"Profile",
				["The target is already opted out. This command will not work."],
				"warn",
				warning,
				{
					advert: false
				}
			)
			return;
		}

		// check for balances
		const containerBuild = async function (shortened) {
			let balanceUser = await balanceCheck(guildMember);
			let miscUser = await miscCheck(guildMember);
			let balanceUser2 = await abbrevBalance(balanceUser.value);
			let workUser = await workCheck(guildMember);
			const bank = await bankCheck(guildMember);
			const bankBalanceUser = await abbrevBalance(bank.value);
			const bankMax = await abbrevBalance(bank.maxValue);
			const { jobs } = await request('getJobs', {
				userId: guildMember.id,
				username: guildMember.username
			});
			let currentUser = await queryUser(guildMember);
			const displayName =
				guildMember.displayName ?? guildMember.globalName ?? guildMember.username;

			// Start profile building
			let msg = `${displayName}'s profile`;
			if (guildMember.id == interaction.user.id) {
				msg = `Your profile`;
			}
			let msgProfile = "";
			let msgBalance = "";
			let msgJob = "";
			let msgMisc = "";

			// level
			msgProfile += `\nLevel: ${miscUser.level} (${miscUser.exp} exp / ${miscUser.nextLevel})`

			// Balance (Bot)
			if (shortened) {
				msgBalance += `\nBalance: ${balanceUser2.displayValue} coins.`;
				msgBalance += `\nBank Balance: ${bankBalanceUser.displayValue} / ${bankMax.displayValue} coins.`;
			} else {
				msgBalance += `\nBalance: ${balanceUser2.value} coins.`;
				msgBalance += `\nBank Balance: ${bankBalanceUser.value} / ${bankMax.displayValue} coins.`;
			}

			// net worth code
			let net = 0;
			let items = await queryItem(undefined, guildMember);
			for (let i = 0; i < items.length; i++) {
				let item = await convItem(items[i].name);
				if (item != undefined) {
					net += item.value * items[i].value
				}
			}
			if (shortened) {
				msgBalance += `\nNet Worth: ${(await abbrevBalance(net + bankBalanceUser.value + balanceUser2.value)).displayValue} (${(await abbrevBalance(net)).displayValue} from items)`
			} else {
				msgBalance += `\nNet Worth: ${(await abbrevBalance(net + bankBalanceUser.value + balanceUser2.value)).value} (${(await abbrevBalance(net)).value} from items)`
			}

			// Job
			if (shortened) {
				if (workUser.jobId == -1 || !jobs[workUser.jobId]) {
					msgJob += `\nThis person does not have a valid job.`;
				} else {
					msgJob += `\nJob: ${jobs[workUser.jobId].name} (Worked ${(await abbrevBalance(workUser.workCount)).displayValue} times)`
					msgJob += `\n-#  (Idea from ${jobs[workUser.jobId].credit})`
					msgJob += `\nWage: ${(await abbrevBalance(workUser.wage)).displayValue} (+-20%)`;
				}
			} else {
				if (workUser.jobId == -1 || !jobs[workUser.jobId]) {
					msgJob += `\nThis person does not have a valid job.`;
				} else {
					msgJob += `\nJob: ${jobs[workUser.jobId].name} (Worked ${(await abbrevBalance(workUser.workCount)).value} times)`
					msgJob += `\n-#  (Idea from ${jobs[workUser.jobId].credit})`
					msgJob += `\nWage: ${(await abbrevBalance(workUser.wage)).value} (+-20%)`;
				}

			}

			// Misc
			if (shortened) {
				msgMisc += `\nMultiplier: ${(await abbrevBalance(balanceUser.multiplier)).displayValue}x`

			} else {
				msgMisc += `\nMultiplier: ${(await abbrevBalance(balanceUser.multiplier)).value}x`
			}
			msgMisc += `\nRegistry Date: <t:${Math.round(currentUser.registerDate / 1000)}:f>`


			// robbable status
			let robbable = "❌";
			if (Number(miscUser.lastRobbed) + 86400 < Math.floor(Date.now() / 1000)) {
				robbable = "✅";
			};
			if (miscUser.robbable == false) {
				robbable = "❌";
			}
			msgMisc += `\nRobbable? ${robbable}`;
			msgMisc += `\n`;

			const components = [];
			components.push({
				type: "text",
				content: `### ${msg}`
			})
			components.push({
				type: "text",
				content: msgProfile
			})

			components.push({
				type: "separator",
				divider: true,
				spacing: 1
			})
			components.push({
				type: "text",
				content: "**Balances:**"
			});
			components.push({
				type: "text",
				content: msgBalance
			});

			components.push({
				type: "separator",
				divider: true,
				spacing: 1
			})
			components.push({
				type: "text",
				content: "**Job:**"
			});
			components.push({
				type: "text",
				content: msgJob
			});

			components.push({
				type: "separator",
				divider: true,
				spacing: 1
			})
			components.push({
				type: "text",
				content: "**Misc:**"
			});
			components.push({
				type: "text",
				content: msgMisc
			});
			let container = await createAdvancedContainer({
				color: "default",
				components: components,
				advert: false,
				copyright: true
			})
			return container;
		}

		// analytics
		await addCommandsUsed(interaction.user);

		// embed and short toggle
		await short(interaction, response, containerBuild, true);
	},
};