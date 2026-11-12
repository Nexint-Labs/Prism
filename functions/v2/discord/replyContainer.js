const { MessageFlags, ContainerBuilder } = require("discord.js")
const { createContainer, createAdvancedContainer } = require("#functions/v2/discord/container")
const { followUpNotif } = require("#functions/v2/notify/checkNotifs");
const { assertBoolean, assertObject, assertString } = require("#functions/v2/core/assert");

/**
 * Reply Container
 * Simple mechanism to reply as a container.
 * Default: Checks notif, not ephemeral, copyright, advert, no seperation
 * @param {import("discord.js").Interaction} interaction 
 * @param {String} title 
 * @param {Array} descArray 
 * @param {String} color 
 * @param {{desc: string, url: string} | null} [thumbnail=null]
 * @param {{ephemeral: boolean, checkNotif: boolean, copyright: Boolean, advert: boolean, separate: boolean}} [options=null]
 */
const replyContainer = async function (interaction, title, descArray, color, thumbnail = null, options = null) {
    let ephemeral = false, checkNotif = true;
    if (options !== null) {
        assertObject(options, "Container Options");
        ephemeral = assertBoolean(options.ephemeral ?? ephemeral, "Reply Ephemeral");
        checkNotif = assertBoolean(options.checkNotif ?? checkNotif, "Reply Check Notifications");
    }
    const container = await createContainer(title, descArray, color, thumbnail, options)
    await handleContainer(interaction, container, ephemeral, checkNotif)
}

/**
 * Reply Gif container
 * @param {import("discord.js").Interaction} interaction 
 * @param {String} title 
 * @param {String} desc 
 * @param {String} url 
 * @param {String} shortURL 
 */
const replyGifContainer = async function (interaction, title, desc = null, url, shortURL) {
    assertString(title, "GIF Title");
    assertString(url, "GIF Original URL");
    assertString(shortURL, "GIF Media URL");
    if (desc != null) {
        assertString(desc, "GIF Description");
    }
    const components = [];
    components.push({
        type: "text",
        content: `### ${title}`
    })
    if (desc) {
        components.push(
            {
                type: "text",
                content: desc
            },
            {
                type: "separator",
                divider: true,
                spacing: 1
            })
    }
    components.push(
        {
            type: "image",
            url: shortURL
        },
    )
    components.push(
        {
            type: "separator",
            divider: true,
            spacing: 1
        },
    )
    components.push(
        {
            type: "text",
            content: `-# Powered by [KLIPY](https://klipy.com) | [View original GIF](${url})`
        },
    )
    const container = await createAdvancedContainer({
        color: "default",
        components: components,
        advert: true,
        copyright: true
    })
    await handleContainer(interaction, container, false, true)
}

/**
 * Handle Container
 * Used for abstracting lol
 * @param {import("discord.js").Interaction} interaction 
 * @param {ContainerBuilder} container 
 * @param {Boolean} ephemeral 
 * @param {Boolean} checkNotif 
 */
const handleContainer = async function (interaction, container, ephemeral, checkNotif) {
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        })
    } else {
        if (ephemeral) {
            await interaction.reply({
                components: [container],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
            })
        } else {
            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            })
        }
    }
    if (checkNotif) {
        await followUpNotif(interaction); // Follow up reply
    }
}

module.exports = {
    replyContainer,
    replyGifContainer
}