
const { client } = require('#bot');
const { pfp } = require('#config/visual/botAssets');
const { queryModChannels } = require('#functions/v2/moderation/databaseQueries/addModChannels');
const { createAdvancedContainer } = require('../discord/container');
const { MessageFlags } = require('discord.js');

const sendLog = async (color, components, modChannel) => {
    const container = await createAdvancedContainer({
        color,
        components,
        advert: false,
        copyright: true
    });

    return modChannel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
    });
};

const logMessage = async function (msg, type, oldMessage = null) {

    // compatibility shim bruh
    const interaction = {
        guildId: msg.guildId,
    }

    const channelId = await queryModChannels(interaction, "msglog");

    if (!channelId) return;

    // Fetch the actual Discord channel.
    const msgChannel = await client.channels.fetch(channelId)
        .catch(() => null);

    if (!msgChannel?.isSendable()) return;

    // START THE ACTUAL THING lol
    const components = [];

    const username =
        msg.author?.displayName
        ?? msg.author?.globalName
        ?? msg.author?.username
        ?? msg.author?.id
        ?? "Unknown User";
    const userID = msg.author?.id
        ?? "Unknown User"
    let thumbnail = msg.author?.displayAvatarURL?.();

    if (thumbnail) {
        thumbnail = {
            desc: userID,
            url: thumbnail
        }
    } else {
        thumbnail = pfp
    }

    switch (type) {
        case "edit": {
            components.push({
                type: "section",
                title: `Edited Message`,
                description: `A message by ${username} (${userID}) was edited.\n[Jump to message](${msg.url})`,
                thumbnail: thumbnail
            });

            components.push({
                type: "separator",
                divider: true,
                spacing: 1
            })
            components.push({
                type: "text",
                content: `**Original content:**`
            })
            components.push({
                type: "text",
                content: oldMessage?.cleanContent?.slice(0, 1024) || "Unavailable"
            })
            components.push({
                type: "text",
                content: `**New content:**`
            })
            components.push({
                type: "text",
                content: msg.cleanContent?.slice(0, 1024) || "Unavailable"
            })
            return await sendLog("info", components, msgChannel);
        }
        case "delete": {
            components.push({
                type: "section",
                title: `Deleted Message`,
                description: `A message by ${username} (${userID}) was deleted.`,
                thumbnail: thumbnail
            });

            components.push({
                type: "separator",
                divider: true,
                spacing: 1
            })
            components.push({
                type: "text",
                content: `**Content:**`
            })
            components.push({
                type: "text",
                content: msg.cleanContent?.slice(0, 1024) || "Unavailable"
            })
            return await sendLog("delmsg", components, msgChannel);
        }

        default:
            console.log("A major error has occured with a bot plugin!")
    }

}

module.exports = {
    logMessage,
}