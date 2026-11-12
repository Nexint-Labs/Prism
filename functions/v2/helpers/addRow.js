const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

/**
 * One stop shop for options menu!
 * uhhhh
 * @returns 
 */
const buildOptionsMenu = async function () {
    const row = new ActionRowBuilder();
    row.addComponents(
        new ButtonBuilder()
            .setCustomId("back")
            .setLabel('<--')
            .setStyle(ButtonStyle.Secondary)
    );
    row.addComponents(
        new ButtonBuilder()
            .setCustomId("prev")
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)
    );
    row.addComponents(
        new ButtonBuilder()
            .setCustomId("next")
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)
    );
    row.addComponents(
        new ButtonBuilder()
            .setCustomId("max")
            .setLabel('-->')
            .setStyle(ButtonStyle.Secondary)
    );
    return row;
}

const buildOptionSelectMenu = async function (optionArray, customId, placeholder) {


    if (optionArray.length == 0) {
        return null;
    }

    const options = optionArray.map(option =>
        new StringSelectMenuOptionBuilder()
            .setLabel(option.label)
            .setValue(option.value)
    );

    const selectRow = new ActionRowBuilder();
    selectRow.addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`${customId}`)
            .setPlaceholder(`${placeholder}`)
            .addOptions(options)
    );

    return selectRow;
}
/**
 * Builds a custom confirm / cancel menu.
 * One stop place for confirming and denying!
 * @returns 
 */
const buildConfirmCancelMenu = async function () {

    const confirm = new ButtonBuilder()
            .setCustomId("confirm")
            .setLabel("✅ Confirm")
            .setStyle(ButtonStyle.Success);
    const cancel = new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("❌ Cancel")
        .setStyle(ButtonStyle.Secondary);

    // actual action row
    const row = new ActionRowBuilder()
        .addComponents(cancel, confirm);
    return row;
}

module.exports = {
    buildOptionsMenu,
    buildOptionSelectMenu,
    buildConfirmCancelMenu
};