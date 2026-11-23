
const { SlashCommandBuilder } = require('discord.js');
const { queryAPI } = require('#functions/discord/api/fetch');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { warning } = require('#config/discord/visual/botAssets');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('multipliers')
        .setDescription('View active and expired multipliers.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to view. Defaults to yourself.')),

    async execute(interaction) {
        await interaction.deferReply();

        if (await checkBlacklist(interaction)) {
            return;
        }

        const guildMember =
            interaction.options.getUser('user') ?? interaction.user;

        if (await optOutChkSingle(guildMember)) {
            await replyContainer(
                interaction,
                "Multipliers",
                ["This user is opted out."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        const result = await queryAPI('/currency/multipliers', {
            userId: guildMember.id
        });

        if (result.error) {
            await replyContainer(
                interaction,
                "Multipliers",
                [result.desc],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        const total = result.content.total;
        const records = result.content.records;
        const now = Date.now();

        let description = `**Total active multiplier: ${total}x**\n\n`;

        if (records.length === 0) {
            description += 'No multipliers found.';
        } else {
            for (const record of records) {
                const active = record.multi > 0 && record.expire > now;

                let expiration = 'Never';

                if (record.expire != null) {
                    const timestamp = Math.floor(record.expire / 1000);
                    expiration = `<t:${timestamp}:R>`;
                }

                description +=
                    `**${record.name}** — ${record.multi}x\n` +
                    `Status: ${active ? 'Active' : 'Inactive / Expired'}\n` +
                    `Expiration: ${expiration}\n\n`;
            }
        }

        await addCommandsUsed(interaction.user);

        await replyContainer(
            interaction,
            "Multipliers",
            [description],
            "default"
        )
    }
};
