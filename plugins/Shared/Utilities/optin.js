const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Sequelize = require('sequelize');
const { loadAnim } = require('#functions/v2/helpers/load');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});

const optOut = sequelize.define('optout', {
    author: {
        type: Sequelize.STRING,
        unique: true,
    }
});

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('data-opt-in')
        .setDescription('Opt in to data collection.'),
    async execute(interaction) {

        // Notify Toggle
        await loadAnim(interaction, [
            "Opting in...",
        ], true)

        if (await checkBlacklist(interaction)) {
            return;
        }

        // Opt-in
        const rowCount = await optOut.destroy({ where: { author: interaction.user.id } })
        if (!rowCount) {
            await replyContainer(
                interaction,
                "Opt In",
                ["Already opted in."],
                "warn",
                warning,
                { advert: false, }
            )
            return
        }
        await replyContainer(
            interaction,
            "Opt In",
            ["✅ Opted in to data collection."],
            "default",
            null,
            { advert: false, }
        )
    },
};