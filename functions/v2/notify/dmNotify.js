const { User, MessageFlags } = require("discord.js");
const { notify } = require("#preload/dbs/funDBs");
const { createContainer, createAdvancedContainer } = require('#functions/v2/discord/container');
const { assertString } = require("#functions/v2/core/assert");

/**
 * DMNotify lol
 * @param {User} user 
 * @param {Array<String>} description 
 * @param {{desc: String, url: String}} [thumbnail = null]
 * @param {Boolean} override 
 * @returns 
 */
const dmNotify = async function (user, description, thumbnail = null, override) {
    if (override) {
        const container = await createContainer(
            "Urgent Notification!",
            description,
            "warn",
            thumbnail,
            {
                checkNotif: false,
                advert: false
            }
        )
        try {
            await user.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
            return 0;
        } catch (error) {
            return error;
        }
    }

    const container = await createContainer(
        "Notification!",
        description,
        "default",
        thumbnail,
        {
            checkNotif: false,
            advert: false
        }
    )
    try {
        const rowCount = await notify.findOne({ where: { userId: user.id } })
        if (rowCount === null && !user.bot) {
            await user.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }
        return 0;
    } catch (error) {
        return error;
    }
}

const dmGifNotify = async function(user, description, url, shortURL){
    assertString(url, "GIF Original URL");
    assertString(shortURL, "GIF Media URL");
    const components = [];
    components.push({
        type: "text",
        content: `### Notification!`
    })
    if (description) {
        components.push(
            {
                type: "text",
                content: description
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
    try {
        const rowCount = await notify.findOne({ where: { userId: user.id } })
        if (rowCount === null && !user.bot) {
            await user.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }
        return 0;
    } catch (error) {
        return error;
    }
}

module.exports = {
    dmNotify,
    dmGifNotify
};