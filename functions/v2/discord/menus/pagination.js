/*
Pagination
This file helps you view Discord notifications
Version ID: 3.0
*/

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, Component } = require('discord.js');
const { buildOptionsMenu, buildOptionSelectMenu } = require("#functions/v2/helpers/addRow")
const { handleInteractionError } = require("#functions/v2/helpers/handleInteractionError");
const { followUpNotif } = require('#functions/v2/notify/checkNotifs');
const { createContainer, createAdvancedContainer } = require('#functions/v2/discord/container')

/**
 * Build a modal lol
 * @param {String} type 
 * @param {Number} index 
 * @returns {TextInputBuilder}
 */
const buildModalInput = (type, index) => {
    const input = new TextInputBuilder()
        .setCustomId(`input_${index}`);

    switch (type) {
        case "bool":
            input
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("true / false");
            break;

        case "int":
            input
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter an integer");
            break;

        case "num":
            input
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter a number");
            break;

        case "str":
            input
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Enter text");
            break;

        default:
            input
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Enter a value");
    }

    return input;
};

/**
 * Build a config model?
 * @param {Object} confirmation 
 * @param {Object} selectedItem 
 * @returns {ModalBuilder} 
 */
const buildConfigModal = (confirmation, selectedItem) => {
    const modal = new ModalBuilder()
        .setCustomId(`config_${confirmation.id}`)
        .setTitle(selectedItem.title);

    for (let i = 0; i < selectedItem.value.length; i++) {
        const field = selectedItem.value[i];
        const input = buildModalInput(field.type, i)
            .setRequired(field.required ?? true);

        const label = new LabelBuilder()
            .setLabel(field.label)
            .setTextInputComponent(input);

        if (field.desc) {
            label.setDescription(field.desc);
        }

        modal.addLabelComponents(label);
    }

    return modal;
};

// Modal value parsing
/**
 * Parse a value for a modal
 * @param {String} type 
 * @param {String} raw 
 * @returns 
 */
const parseModalValue = (type, raw) => {
    switch (type) {
        case "bool": {
            const normalized = raw.trim().toLowerCase();

            if (normalized !== "true" && normalized !== "false") {
                return undefined;
            }

            return normalized === "true";
        }

        case "int": {
            const value = Number(raw);
            return Number.isSafeInteger(value) ? value : undefined;
        }

        case "num": {
            const value = Number(raw);
            return !raw.trim() || !Number.isFinite(value) ? undefined : value;
        }

        case "str":
            return raw;

        default:
            return raw;
    }
};

/**
 * parse modal values but recursive??
 * @param {Object} submitted 
 * @param {Object} fields 
 * @returns 
 */
const parseModalValues = (submitted, fields) => {
    const values = [];

    for (let i = 0; i < fields.length; i++) {
        const raw = submitted.fields.getTextInputValue(`input_${i}`);

        if (fields[i].required === false && !raw.trim()) {
            values.push(null);
            continue;
        }

        values.push(parseModalValue(fields[i].type, raw));
    }

    return values;
};

// Back arrow lol
const buildBackRow = () => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId("notif_back")
        .setLabel("<")
        .setStyle(ButtonStyle.Danger)
);

/**
 * Builds the list view of stuff
 * @param {String} title 
 * @param {Array<{title: String, desc: String, displayValue: String, thumbnail: {desc: String, url: String}}>} items 
 * @param {Number} page 
 * @param {Number} pageSize 
 * @param {Number} maxPage 
 * @returns {createContainer}
 */
const buildListView = async (title, items, page, pageSize, maxPage) => {
    const components = [
        {
            type: "text",
            content: `### ${title}`
        }
    ];

    const itemArray = [];
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, items.length);

    for (let i = start; i < end; i++) {
        const item = items[i];

        let description = `${item.desc}\n`;

        if (item.value !== "carry") {
            description += `Current Value: ${item.displayValue}\n`;
        } else if (item.displayValue !== undefined) {
            description += `${item.displayValue}\n`;
        }

        description += `(Select Item ${i + 1})`;

        if (item.thumbnail) {
            components.push({
                type: "section",
                title: item.title,
                description,
                thumbnail: item.thumbnail
            });
        } else {
            components.push({
                type: "text",
                content: `**${item.title}**\n${description}`
            });
        }

        itemArray.push({
            label: `Item ${i + 1}`,
            value: `${i}`,
            description: `help ${i + 1}`
        });
    }

    if (items.length === 0) {
        components.push({
            type: "text",
            content: "There are no items in this menu at this time."
        });
    } else {
        components.push({
            type: "separator",
        });
        components.push({
            type: "text",
            content: `-# Page ${page} / ${maxPage}`
        });
    }

    const msg = await createAdvancedContainer({
        color: "default",
        components,
        advert: true,
        copyright: true
    });

    const row = await buildOptionsMenu();

    const selectRow = itemArray.length > 0
        ? await buildOptionSelectMenu(
            itemArray,
            "item_select",
            title
        )
        : undefined;

    return { msg, row, selectRow };
};

/**
 * 
 * @param {String} title 
 * @param {Array<String>} items 
 * @param {Number} page 
 * @param {Number} pageSize 
 * @param {Number} maxPage 
 * @param {{desc: String, url: String}} thumbnail 
 * @returns 
 */
const buildTextView = async (title, items, page, pageSize, maxPage, thumbnail = null) => {
    const start = (page - 1) * pageSize;
    const description = items.slice(start, start + pageSize).join("\n");

    return {
        msg: await createContainer(
            title,
            [`${description}`, `--- Page (${page}/${maxPage}) ---`],
            "default",
            thumbnail, // TODO: Replace later (thumbnail),
            { separate: true }
        ),
        row: await buildOptionsMenu(),
        selectRow: undefined
    };
};

/**
 * Build the notifications
 * @param {{title: String, content: String, type: String}} item 
 * @param {*} thumbnail 
 * @returns 
 */
const buildNotificationView = async (item, thumbnail = null) => {

    let description = `${item.content}`;
    description += `\n-# Type: ${item.type}`;

    return {
        msg: await createContainer(
            item.title,
            [description],
            "default",
            thumbnail, // TODO: Replace later (thumbnail)
        ),
        row: buildBackRow(),
        selectRow: undefined
    };
};

/**
 * Edit Menu View
 * @param {import('discord.js').Interaction} interaction 
 * @param {{msg: Component, row: Component, selectRow: Component}} view 
 * @param {*} initial 
 */
const editMenuView = async (interaction, view, initial = false) => {
    await interaction.editReply({
        components: [
            view.msg,
            view.row,
            view.selectRow
        ].filter(Boolean),
        flags: MessageFlags.IsComponentsV2
    });

    if (initial) {
        await followUpNotif(interaction);
    }
};

// Independent modal submission handler.
// Uses the same revision checks and database-update behavior as before.
const handleConfigContainer = async ({
    interaction,
    confirmation,
    modal,
    selectedItem,
    modalRevision,
    state,
    onSubmit,
    updateItems
}) => {
    const submitted = await confirmation.awaitModalSubmit({
        time: 300000,
        filter: i =>
            i.user.id === interaction.user.id &&
            i.customId === modal.data.custom_id
    }).catch(() => null);

    if (!submitted) return;

    const values = parseModalValues(submitted, selectedItem.value);

    await submitted.deferUpdate();

    if (modalRevision !== state.uiRevision) return;

    let description;
    let type;

    if (values.some(value => value === undefined)) {
        description = "One or more inputs are invalid. No changes have been made.";
        type = "Error";
    } else {
        const result = await onSubmit(selectedItem, values);

        description = result.desc;
        type = selectedItem.value.map(field => field.type).join(", ");

        state.items = await updateItems();
        state.maxPage = Math.max(1, Math.ceil(state.items.length / state.pageSize));
        state.page = Math.min(state.page, state.maxPage);
    }

    const resultContainer = await createContainer(
        selectedItem.title,
        [`${description}\n-# Type: ${type}`],
        "default"
    );

    const resultRow = buildBackRow();

    if (modalRevision !== state.uiRevision) return;

    await interaction.editReply({
        components: [
            resultContainer,
            resultRow
        ],
        flags: MessageFlags.IsComponentsV2
    });
};

// Menu controller

// Item should be structured like:
// i'm not sure lol
const pageMenu = async function (interaction, response, title, items, onSubmit, updateItems, displayOnly = false) {
    const pageSize = displayOnly ? 10 : 2;

    const state = {
        page: 1,
        pageSize,
        maxPage: Math.max(1, Math.ceil(items.length / pageSize)),
        uiRevision: 0,
        items
    };

    const refreshItems = async () => {
        const refreshed = await updateItems();
        if (!Array.isArray(refreshed)) return;

        state.items = refreshed;
        state.maxPage = Math.max(1, Math.ceil(state.items.length / state.pageSize));
        state.page = Math.min(state.page, state.maxPage);
    };

    const renderList = () => displayOnly
        ? buildTextView(
            title, state.items, state.page,
            state.pageSize, state.maxPage
        )
        : buildListView(
            title, state.items, state.page,
            state.pageSize, state.maxPage
        );

    await editMenuView(interaction, await renderList(), true);

    const collectorFilter = i => i.user.id === interaction.user.id;

    while (true) {
        try {
            const confirmation = await response.resource.message.awaitMessageComponent({
                filter: collectorFilter,
                time: 300_000
            });

            // Pagination buttons
            if (confirmation.customId == "back") {
                state.page = 1;
            }

            if (confirmation.customId == "prev") {
                state.page -= 1;
                if (state.page < 1) {
                    state.page = state.maxPage;
                }
                if (state.maxPage <= 0) {
                    state.page = 1;
                }
            }

            if (confirmation.customId == "next") {
                state.page += 1;
                if (state.page > state.maxPage) {
                    state.page = 1;
                }
            }

            if (confirmation.customId == "max") {
                state.page = state.maxPage;
            }

            if (confirmation.customId !== "item_select") {
                state.uiRevision++;
            }

            if (confirmation.customId === "notif_back") {
                await confirmation.deferUpdate();
                await editMenuView(interaction, await renderList());
                continue;
            }

            let view;

            if (confirmation.customId === "item_select") {
                const selectedValue = Number(confirmation.values[0]);

                if (state.items[selectedValue].value !== "carry") {
                    const selectedItem = state.items[selectedValue];
                    const modal = buildConfigModal(confirmation, selectedItem);
                    const modalRevision = ++state.uiRevision;

                    await confirmation.showModal(modal);

                    // Rebuild the menu to clear its selected state.
                    await editMenuView(interaction, await renderList());

                    // Do not block the pagination loop while a modal is open.
                    void handleConfigContainer({
                        interaction,
                        confirmation,
                        modal,
                        selectedItem,
                        modalRevision,
                        state,
                        onSubmit,
                        updateItems
                    }).catch(console.error);

                    continue;
                } else {
                    await confirmation.deferUpdate();
                    view = await buildNotificationView(
                        state.items[selectedValue],
                        state.items[selectedValue].thumbnail
                    );
                }
            } else {
                await confirmation.deferUpdate();

                if (!displayOnly) {
                    await refreshItems();
                }

                view = await renderList();
            }

            await editMenuView(interaction, view);
        } catch (error) {
            await handleInteractionError(interaction, response, error);
            break;
        }
    }
};

module.exports = {
    pageMenu
};
