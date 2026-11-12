
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const confirm = async function (interaction, response, promptEmbed) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("confirm")
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({
        embeds: [promptEmbed],
        components: [row]
    });

    try {
        const confirmation =
            await response.resource.message.awaitMessageComponent({
                filter: i =>
                    i.user.id === interaction.user.id &&
                    ["confirm", "cancel"].includes(i.customId),
                time: 30_000
            });

        await confirmation.deferUpdate();

        return {
            decision: confirmation.customId === "confirm"
                ? "confirm"
                : "cancel",
            confirmation
        };

    } catch (error) {
        if (error.code !== "InteractionCollectorError") {
            throw error;
        }
        return {
            decision: "timeout",
            confirmation: null
        };
    }
};

module.exports = { confirm };
