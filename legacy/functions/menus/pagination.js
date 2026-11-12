/*
View Notifications
This file helps you view Discord notifications
Version ID: 3.0
*/

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { embed } = require('#functions/embed');
const { addCommandsUsed } = require('#functions/usageData');
const { checkBlacklist } = require("#functions/auth/checkBlacklist")
const { listUnreadNotifs } = require("#functions/notify/notifs")
const { buildOptionsMenu, buildOptionSelectMenu } = require("#functions/general/addRow")
const { handleInteractionError } = require("#functions/general/interaction");
const { replyEmbed } = require('#functions/general/replyEmbed');
const { followUpNotif } = require('#functions/notify/checkNotifs');

// Modal construction

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

// View construction

const buildBackRow = () => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId("notif_back")
        .setLabel("<")
        .setStyle(ButtonStyle.Danger)
);

const buildListView = async (title, items, page, pageSize, maxPage) => {
    let description = "";
    const itemArray = [];

    for (
        let i = (page - 1) * pageSize;
        i < Math.min(pageSize + ((page - 1) * pageSize), items.length);
        i++
    ) {
        description += `${items[i].title}:\n`;
        description += `${items[i].desc}\n`;
        if (items[i].value !== "carry") {
            description += `Current Value: ${items[i].displayValue}\n`;
        } else if (items[i].displayValue !== undefined) {
            description += `${items[i].displayValue}\n`;
        }
        description += `(Select Item ${i + 1})\n\n`;

        itemArray.push({
            label: `Item ${i + 1}`,
            value: `${i}`,
            description: `help ${i + 1}`
        });
    }

    if (items.length == 0) {
        description += "There are no items in this menu at this time.";
    } else {
        description += `-# Page ${page} / ${maxPage}\n`;
    }

    const msg = await embed(`${title}`, description, null, null);
    const row = await buildOptionsMenu();
    const selectRow = await buildOptionSelectMenu(itemArray, "item_select", `${title}`);

    return { msg, row, selectRow };
};

const buildTextView = async (title, items, page, pageSize, maxPage) => {
    const start = (page - 1) * pageSize;
    const description = items.slice(start, start + pageSize).join("\n");

    return {
        msg: await embed(
            title,
            `${description}\n\n--- Page (${page}/${maxPage}) ---`,
            null,
            null
        ),
        row: await buildOptionsMenu(),
        selectRow: undefined
    };
};

const buildNotificationView = async (item) => {

    let description = `${item.content}`;
    description += `\n-# Type: ${item.type}`;

    return {
        msg: await embed(`${item.title}`, description, null, null),
        row: buildBackRow(),
        selectRow: undefined
    };
};

const editMenuView = async (interaction, view, initial = false) => {
    await interaction.editReply({
        embeds: [view.msg],
        components: [view.row, view.selectRow].filter(Boolean),
        ...(initial ? { withResponse: true, withReply: true } : {})
    });

    if (initial) {
        await followUpNotif(interaction);
    }
};

// Independent modal submission handler.
// Uses the same revision checks and database-update behavior as before.
const handleConfigModal = async ({
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

    const resultEmbed = await embed(
        selectedItem.title,
        `${description}\n-# Type: ${type}`,
        null,
        null
    );

    const resultRow = buildBackRow();

    if (modalRevision !== state.uiRevision) return;

    await interaction.editReply({
        embeds: [resultEmbed],
        components: [resultRow]
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
        state.items = await updateItems();
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
                    void handleConfigModal({
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
                    view = await buildNotificationView(state.items[selectedValue]);
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
