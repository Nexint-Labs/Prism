const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const handleInteractionError = async function (interaction, response, error) {

    // Handle collector expiration (120 seconds of inactivity)
    if (error.name === "Error [InteractionCollectorError]" || error.code === 'InteractionCollectorError') {
        // Disable components on timeout
        const message = await interaction.fetchReply();
        const currentRows = message.components;
        const disabledRows = currentRows.map(row => {
            const disabledComponents = row.components.map(component => {
                if (component.type === 2) { // Button
                    return ButtonBuilder.from(component.data).setDisabled(true);
                }
                if (component.type === 3) { // Select Menu
                    return StringSelectMenuBuilder.from(component.data).setDisabled(true);
                }
                return component;
            });
            return new ActionRowBuilder().addComponents(disabledComponents);
        });

        await interaction.editReply({
            components: disabledRows
        }).catch(() => null);
    } else {
        console.error("Interaction error:", error);
    }
}

module.exports = {
    handleInteractionError,
}