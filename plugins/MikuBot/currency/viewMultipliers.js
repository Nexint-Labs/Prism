
const { SlashCommandBuilder } = require('discord.js');
const { queryMulti, updateMulti } = require('#functions/v2/currency/apiRead');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/v2/opt-out/optOut');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { warning } = require('#config/visual/botAssets');

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

        const total = await updateMulti(guildMember);
        const records = await queryMulti(guildMember);
        const now = Date.now();

        let description = `**Total active multiplier: ${total}x**\n\n`;

        if (records.length === 0) {
            description += 'No multipliers found.';
        } else {
            for (const record of records) {
                const active = record.value > 0 &&
                    (record.expire == null || record.expire > now);

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
