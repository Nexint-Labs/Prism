const { ContainerBuilder, ComponentType, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, MediaGalleryBuilder, ButtonStyle } = require("discord.js");
const { assertString, assertStrictArray, assertObject, assertBoolean, assertArray, assertFinite } = require("#functions/v2/core/assert");
const { setColor } = require("#functions/v2/core/setColor");
const { footerText } = require("#config/core/discord");
const { emoji } = require("#config/visual/emoji");
const { getAdvert } = require("#functions/v2/api/advert");

/**
 * Create Container
 * Creates a container.
 * Default: copyright, advert, no seperation
 * @param {String} title 
 * @param {Array<String>} description 
 * @param {String} color 
 * @param {{desc: string, url: string} | null} [thumbnail=null]
 * @param {{ephemeral: boolean, checkNotif: boolean, copyright: Boolean, advert: boolean, separate: boolean}} [options=null]
 * @returns 
 */
const createContainer = async function (title, description = [], color = "default", thumbnail = null, options = null) {
    // Assert starting parameters
    assertString(title, "Container Title");
    assertStrictArray(description, "Container Description", "string");

    // desc has to be length at least 1 lol it cant be empty smh
    if (description.length < 1) {
        throw new RangeError(`Description is out of bounds. (${description})`)
    }
    const components = [];

    // Options
    let advert = true;
    let copyright = true;
    let separate = false;
    if (options !== null) {
        assertObject(options, "Container Options");
        advert = assertBoolean(options.advert ?? advert, "Container Advert");
        copyright = assertBoolean(options.copyright ?? copyright, "Container Copyright");
        separate = assertBoolean(options.separate ?? separate, "Container Seperator");
    }
    // Titles
    if (thumbnail !== null) {

        // Assert required parameters
        assertObject(thumbnail, "Container Thumbnail");
        assertString(thumbnail.desc, "Container Thumbnail Description");
        assertString(thumbnail.url, "Container Thumbnail URL");

        components.push({
            type: "section",
            title: title,
            description: description[0],
            thumbnail: thumbnail,
        });
    } else {
        components.push({
            type: "text",
            content: `### ${title}`
        });

        components.push({
            type: "text",
            content: description[0]
        });
    }

    // Remaining descriptions
    for (let i = 1; i < description.length; i++) {
        if (separate) {
            components.push({
                type: "separator",
                divider: true,
                spacing: 1
            });
        }

        components.push({
            type: "text",
            content: description[i]
        });
    }

    const container = await createAdvancedContainer({
        color: color,
        components: components,
        advert: advert,
        copyright: copyright
    })

    return container
}

/**
 * Create an advanced container
 * @param {{color: String, components: Array<{type: String, }>, advert: boolean, copyright: boolean}} param0 
 * @returns 
 */
const createAdvancedContainer = async ({ color = "default", components = [], advert = true, copyright = true } = {}) => {

    // Start Assumptions
    assertString(color, "Container Color");
    assertBoolean(advert, "Container Advert");
    assertBoolean(copyright, "Container Copyright");
    assertStrictArray(components, "Container Array", "object");

    // Container
    const container = new ContainerBuilder()
        .setAccentColor(setColor(color));

    // Loop through
    for (const component of components) {

        // Check if the component type even exists
        assertString(component.type, "Nested Component Type");
        switch (component.type) {

            // Text component
            case "text":
                assertString(component.content, "Nested Component Content");
                container.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(component.content)
                );
                break;

            // Separator component
            case "separator":
                const divide = assertBoolean(component.divider ?? true, "Nested Component Divider");
                const space = assertFinite(component.spacing ?? 1, "Nested Component Spacing");
                if (![1, 2].includes(space)) {
                    throw new RangeError("Invalid separator spacing.");
                }
                container.addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(divide)
                        .setSpacing(space)
                );
                break;

            // Image Component
            case "image":
                assertString(component.url, "Nested Image URL");

                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder()
                        .addItems(item => item.setURL(component.url))
                );
                break;

            // Section component
            case "section": {

                if (component.thumbnail && component.button) {
                    throw new TypeError(
                        "Section cannot have both thumbnail and button."
                    );
                }
                const section = new SectionBuilder();

                assertString(component.title, "Nested Component Title");
                assertString(component.description, "Nested Component Description");

                section.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`### ${component.title}`)
                );

                section.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(component.description)
                );

                if (component.thumbnail) {
                    assertObject(component.thumbnail, "Nested Component Thumbnail");
                    assertString(component.thumbnail.desc, "Nested Component Thumbnail Desc");
                    assertString(component.thumbnail.url, "Nested Component Thumbnail URL");
                    section.setThumbnailAccessory(accessory =>
                        accessory
                            .setDescription(component.thumbnail.desc)
                            .setURL(component.thumbnail.url)
                    );
                } else if (component.button) {
                    assertObject(component.button, "Nested Component Button");
                    assertString(component.button.id, "Nested Component Button ID");
                    assertString(component.button.label, "Nested Component Button Label");

                    if (![
                        ButtonStyle.Primary,
                        ButtonStyle.Secondary,
                        ButtonStyle.Success,
                        ButtonStyle.Danger
                    ].includes(component.button.style)) {
                        throw new TypeError("Invalid nested button style.");
                    }

                    section.setButtonAccessory(button =>
                        button
                            .setCustomId(component.button.id)
                            .setLabel(component.button.label)
                            .setStyle(component.button.style)
                    );
                } else {
                    throw new Error(
                        "Section requires a thumbnail or button accessory."
                    );
                }

                container.addSectionComponents(section);
                break;
            }

            default:
                throw new Error(
                    `Unknown component type: ${component.type}`
                );
        }
    }

    if (advert) {
        const advertisement = await getAdvert();

        if (advertisement) {
            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(1)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`-# ${advertisement}`)
            );
        }
    }

    if (copyright) {
        container.addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(1)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`-# ${emoji.pfpEmoji} ${footerText}`)
        );
    }

    return container;
};

module.exports = {
    createContainer,
    createAdvancedContainer
};