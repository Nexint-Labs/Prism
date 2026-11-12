
const { InteractionContextType, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { replyContainer } = require("#functions/v2/discord/replyContainer");

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Moderation bypass commands. Only accessable to server admins.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('logging')
                .setDescription('Enable or disable the logging bypass in this channel.')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('Enable or disable logging?')
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' },
                        )))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild

        await replyContainer(interaction, "WIP", ["This command is actively in development."], "info");
        /*
        if (interaction.guild != null) {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                switch (interaction.options.getSubcommand()) {
                    case "logging":
                        switch (interaction.options.getString('value')) {
                            case "enable":
                                try {
                                    await bypassLogs.create({
                                        channelId: interaction.channelId,
                                    });
                                    await interaction.reply("Logging is now being bypassed in this channel.\n\n-# Modlog is also bypassed for data privacy.");
                                    if (interaction.channel.permissionsFor(interaction.guild.members.me).has(['ManageMessages'], true) == false && interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        await interaction.channel.send({ content: "-# Please give me permissions to disable links and invites! I need the permission \"Manage Messages\"." });
                                    };
                                } catch (error) {
                                    if (error.name === 'SequelizeUniqueConstraintError') {
                                        await interaction.reply({ content: "Logging is already bypased here.", flags: MessageFlags.Ephemeral });
                                        return;
                                    }
                                }
                                break;
                            case "disable":
                                const rowCount = await bypassLogs.destroy({
                                    where: {
                                        channelId: interaction.channelId,
                                    }
                                });
                                if (!rowCount) {
                                    await interaction.reply({ content: "Logging already works normally here.", flags: MessageFlags.Ephemeral });
                                    return;
                                }
                                await interaction.reply({ content: "Logging now operates normally here." });
                                break;
                        }
                        break;
                    default:
                        await interaction.reply("This command is under construction.")
                }
            } else {

                await interaction.reply({ content: "You don't have permission to do this.\n\nBypass commands are only accessable to true administrators.", flags: MessageFlags.Ephemeral });
            }


        } else {
            switch (interaction.options.getSubcommand()) {
                default:
                    await interaction.reply("This command does not work in DMs. Try again in a server!");
            }
        }
        return;
        */
    }
};
