const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const { handleInteractionError } = require("#functions/v2/helpers/handleInteractionError");
const { followUpNotif } = require("#functions/v2/notify/checkNotifs");

/**
 * Short function?
 * @param {import("discord.js").Interaction} interaction 
 * @param {import("discord.js").ResponseLike} response 
 * @param {Function} containerBuild 
 * @param {Boolean} refresh 
 */
const short = async function (interaction, response, containerBuild, refresh = false) {
    let shortened = true;

    // row builder
    const rowBuild = async function () {

        // Build storefront
        let rows = new ActionRowBuilder();
        if (shortened) {
            rows.addComponents(
                new ButtonBuilder()
                    .setCustomId("short")
                    .setLabel('Short? ✔')
                    .setStyle(ButtonStyle.Success)
            );
        } else {
            rows.addComponents(
                new ButtonBuilder()
                    .setCustomId("short")
                    .setLabel('Short? ❌')
                    .setStyle(ButtonStyle.Danger)
            );
        }
        if (refresh) {
            rows.addComponents(
                new ButtonBuilder()
                    .setCustomId("refresh")
                    .setLabel("🔄")
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        return rows;
    }
    let row = await rowBuild();

    // Initial reply
    await interaction.editReply({
        components: [await containerBuild(shortened), row],
        flags: MessageFlags.IsComponentsV2
    });

    await followUpNotif(interaction);

    // balance refresh function
    while (true) {
        try {
            const confirmation = await response.resource.message.awaitMessageComponent({
                filter: i => i.user.id === interaction.user.id,
                time: 120_000
            });

            if (confirmation.customId === "short") {
                shortened = !shortened;
            }

            if (confirmation.customId === "short" ||
                (refresh && confirmation.customId === "refresh")) {

                await confirmation.deferUpdate();

                await interaction.editReply({
                    components: [await containerBuild(shortened), await rowBuild()],
                    flags: MessageFlags.IsComponentsV2
                });
            }
        } catch (error) {
            await handleInteractionError(interaction, response, error);
            break;
        }
    }
}

module.exports = {
    short
}