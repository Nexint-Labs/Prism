const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shardtest')
        .setDescription('Test shard command routing'),

    async execute(interaction) {
        const client = interaction.client;

        await interaction.reply({
            content: [
                `Cluster: ${client.cluster.id}`,
                `Shard: ${interaction.guild?.shardId ?? 'DM'}`,
                `PID: ${process.pid}`,
                `Guild: ${interaction.guildId}`
            ].join('\n'),
            flags: MessageFlags.Ephemeral
        });
    }
};