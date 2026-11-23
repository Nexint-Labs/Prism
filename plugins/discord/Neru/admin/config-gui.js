
const { InteractionContextType, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { pageMenu } = require("#functions/discord/container/menus/pagination");
const { createConfigEngine } = require('#functions/discord/moderation/helpers/configEngine');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('config-gui')
        .setDescription('Configuration commands. Only accessable to server admins.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {

        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        const { onSubmit, updateValues } =
            createConfigEngine(interaction);

        const itemArray = await updateValues();
        const result = await pageMenu(interaction, response, "Server Settings:", itemArray, onSubmit, updateValues)
    }
};
