
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags } = require("discord.js");
const { buildConfirmCancelMenu } = require("#functions/v2/helpers/addRow");

/**
 * Confirm / deny
 * This confirms or denies depending on user input.
 * @param {import("discord.js").Interaction} interaction 
 * @param {Object} response 
 * @param {ContainerBuilder} promptContainer 
 * @returns 
 */
const confirm = async function (interaction, response, promptContainer) {

    // Confirm / deny rows
    const row = await buildConfirmCancelMenu()

    // Confirm or deny prompt?
    await interaction.editReply({
        components: [promptContainer, row],
        flags: MessageFlags.IsComponentsV2
    });

    // Try to get the users response.
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
