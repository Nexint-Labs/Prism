
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder, MediaGalleryBuilder } = require("discord.js");
const { buildOptionsMenu } = require("#functions/v2/helpers/addRow");
const { pageSize } = require("#config/visual/menu");
const { createContainer } = require("#functions/v2/discord/container");
const { assertStrictArray, assertString } = require("#functions/v2/core/assert");
const { handleInteractionError } = require("#functions/v2/helpers/handleInteractionError");
const { followUpNotif } = require("#functions/v2/notify/checkNotifs");

/**
 * Returns a message array.
 * @param {Number} page 
 * @param {Array<String>} msgArray 
 * @param {Array<String>} noResultArray 
 * @returns 
 */
const buildMsgArray = function (page, msgArray, noResultArray, compressed) {
    let msg = [];
    let msgString = ""
    for (let i = (page - 1) * pageSize; i < Math.min(pageSize + ((page - 1) * pageSize), msgArray.length); i++) {
        if (compressed) {
            msgString += `${msgArray[i]}\n`
        } else {
            msg.push(msgArray[i]);
        }
    }
    msgString.trim();
    if (compressed) {
        msg.push(msgString)
    }
    if (msg.length == 0 || (msgString == "" && compressed)) {
        return noResultArray
    }
    msg.push(`Page ${page} / ${Math.max(1, Math.ceil(msgArray.length / pageSize))}`)
    return msg
}

/**
 * Simple Menu
 * Builds an array from a message array
 * @param {import("discord.js").Interaction} interaction 
 * @param {import("discord.js").ResponseLike} response 
 * @param {String} title 
 * @param {Array<String>} msgArray 
 * @param {Array<String>} noResultArray  
 * @param {{compressed: boolean, checkNotif: boolean, advert: boolean, copyright: boolean, watermark: String}} options
 * @param {{desc: String, url: URL}} thumbnail
 * @param {String} footerImage
 * @returns 
 */
const simpleMenu = async function (interaction, response, title, msgArray, noResultArray, options, thumbnail = null, footerImage = null) {
    assertString(title, "Simple Menu Title");
    assertStrictArray(msgArray, "Simple Menu Message Array", "string");
    assertStrictArray(noResultArray, "Simple Menu Error Message Array", "string");

    // Pagination menu
    const row = await buildOptionsMenu();

    // Message Array
    let page = 1;
    let compressed = options.compressed;
    if (compressed !== false) {
        compressed = true
    }
    let maxPage = Math.max(1, Math.ceil(msgArray.length / pageSize));
    let finishedArray = buildMsgArray(page, msgArray, noResultArray, compressed)

    const promptContainer = await createContainer(
        title,
        finishedArray,
        "default",
        thumbnail,
        options
    )

    if (footerImage) {
        assertString(footerImage, "Image URL");

        promptContainer.spliceComponents(
            1,
            0,
            new MediaGalleryBuilder()
                .addItems(item => item.setURL(footerImage)),
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1)
        );
    }

    if (options.watermark) {
        assertString(options.watermark, "Watermark");
        promptContainer.addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1)
        );
        promptContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`-# ${options.watermark}`)
        );
    }

    // Reject if there's no result lol
    if (msgArray.length == 0) {
        await interaction.editReply({
            components: [promptContainer],
            flags: MessageFlags.IsComponentsV2
        });
        return
    }

    // Reply
    await interaction.editReply({
        components: [promptContainer, row],
        flags: MessageFlags.IsComponentsV2
    });

    // Follow Up Notification
    if (options.checkNotif) {
        await followUpNotif(interaction);
    }

    // Try to get the users response.
    while (true) {
        try {
            const confirmation =
                await response.resource.message.awaitMessageComponent({
                    filter: i =>
                        i.user.id === interaction.user.id &&
                        ["back", "prev", "next", "max"].includes(i.customId),
                    time: 120_000
                });

            // defer Update
            await confirmation.deferUpdate();

            // Pagination buttons
            if (confirmation.customId == "back") {
                page = 1;
            }
            if (confirmation.customId == "prev") {
                page -= 1;
                if (page < 1) {
                    page = maxPage;
                }
            }
            if (confirmation.customId == "next") {
                page += 1;
                if (page > maxPage) {
                    page = 1;
                }
            }
            if (confirmation.customId == "max") {
                page = maxPage;
            }

            // Update array
            finishedArray = buildMsgArray(page, msgArray, noResultArray, compressed)
            const promptContainer = await createContainer(
                title,
                finishedArray,
                "default",
                thumbnail,
                {
                    checkNotif: false,
                    advert: false,
                    copyright: options.copyright
                }
            )

            if (footerImage) {
                assertString(footerImage, "Image URL");

                promptContainer.spliceComponents(
                    1,
                    0,
                    new MediaGalleryBuilder()
                        .addItems(item => item.setURL(footerImage)),
                    new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(1)
                );
            }

            if (options.watermark) {
                assertString(options.watermark, "Watermark");
                promptContainer.addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(1)
                );
                promptContainer.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`-# ${options.watermark}`)
                );
            }

            // Update response
            await interaction.editReply({
                components: [promptContainer, row],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            await handleInteractionError(
                interaction,
                response,
                error
            )
            break;
        }

    }
};

module.exports = { simpleMenu };
