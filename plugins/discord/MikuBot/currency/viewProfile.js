const { SlashCommandBuilder } = require('discord.js');
const { postAPI } = require('#functions/discord/api/fetch');
const { convNameToID } = require('#functions/discord/currency/userInfo');
const { queryUser, addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { createAdvancedContainer } = require('#functions/discord/container/container');
const { short } = require('#functions/discord/container/menus/short');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { getUser } = require('#functions/discord/container/shardInfo');
const { prefix } = require('#functions/discord/core/pluralValues');

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
				guildMember = await getUser(userID, interaction.client);
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
			const result = await postAPI('/currency', {
				userId: guildMember.id,
				name: guildMember.username
			});

			if (result.error) {
				return null;
			}

			const {
				balance: balanceUser,
				bank,
				job: workUser,
				jobInfo,
				misc: miscUser,
				multi,
				itemNetWorth
			} = result.content;

			const balanceUser2 = abbrevBalance(balanceUser.value);
			const bankBalanceUser = abbrevBalance(bank.value);
			const bankMax = abbrevBalance(bank.maxValue);

			const currentUser = await queryUser(guildMember);
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
				msgBalance += `\nBalance: ${balanceUser2.displayValue} ${prefix(balanceUser2.value)}.`;
				msgBalance += `\nBank Balance: ${bankBalanceUser.displayValue} / ${bankMax.displayValue} ${prefix(bankMax.value)}.`;
			} else {
				msgBalance += `\nBalance: ${balanceUser2.value} ${prefix(balanceUser2.value)}.`;
				msgBalance += `\nBank Balance: ${bankBalanceUser.value} / ${bankMax.value} ${prefix(bankMax.value)}.`;
			}

			// net worth code
			const net = itemNetWorth ?? 0;
			if (shortened) {
				msgBalance += `\nNet Worth: ${(abbrevBalance(net + bankBalanceUser.value + balanceUser2.value)).displayValue} ${prefix(net + bankBalanceUser.value + balanceUser2.value)} (${(abbrevBalance(net)).displayValue} ${prefix(net)} from items)`
			} else {
				msgBalance += `\nNet Worth: ${(abbrevBalance(net + bankBalanceUser.value + balanceUser2.value)).value} ${prefix(net + bankBalanceUser.value + balanceUser2.value)} (${(abbrevBalance(net)).value} ${prefix(net)} from items)`
			}

			// Job
			if (shortened) {
				if (!workUser || workUser.jobId == -1 || !jobInfo) {
					msgJob += `\nThis person does not have a valid job.`;
				} else {
					msgJob += `\nJob: ${jobInfo.name} (Worked ${(abbrevBalance(workUser.workCount)).displayValue} times)`
					msgJob += `\n-#  (Idea from ${jobInfo.credit})`
					msgJob += `\nWage: ${(abbrevBalance(workUser.wage)).displayValue} ${prefix(workUser.wage)} (+-20%)`;
				}
			} else {
				if (!workUser || workUser.jobId == -1 || !jobInfo) {
					msgJob += `\nThis person does not have a valid job.`;
				} else {
					msgJob += `\nJob: ${jobInfo.name} (Worked ${(abbrevBalance(workUser.workCount)).value} times)`
					msgJob += `\n-#  (Idea from ${jobInfo.credit})`
					msgJob += `\nWage: ${(abbrevBalance(workUser.wage)).value} ${prefix(workUser.wage)} (+-20%)`;
				}

			}

			const multiplier = abbrevBalance(multi);
			// Misc
			if (shortened) {
				msgMisc += `\nMultiplier: ${multiplier.displayValue}x`

			} else {
				msgMisc += `\nMultiplier: ${multiplier.value}x`
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