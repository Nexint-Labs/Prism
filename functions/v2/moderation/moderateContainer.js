
const { client } = require('#bot');
const { queryModChannels } = require('#functions/v2/moderation/databaseQueries/addModChannels');
const { MessageFlags } = require('discord.js');
const { createAdvancedContainer } = require('#functions/v2/discord/container');
const { pfp } = require('#config/visual/botAssets');

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

const moderateContainer = async function (guildId, type, reason, msg = null, moderator, targetUser, caseId = null) {

    // compatibility shim bruh
    const interaction = {
        guildId: guildId,
    }

    const channelId = await queryModChannels(interaction, "modlog");

    if (!channelId) return;

    // Fetch the actual Discord channel.
    const modChannel = await client.channels.fetch(channelId)
        .catch(() => null);

    if (!modChannel?.isSendable()) return;

    let caseName = "";
    if (caseId !== null) {
        caseName = `(Case ${caseId})`
    }
    const components = [];

    const modName =
        moderator?.displayName
        ?? moderator?.globalName
        ?? moderator?.username
        ?? moderator?.id
        ?? "Unknown Moderator";

    // Special Cases are handled first
    switch (type) {
        case "automod": {

            // Starting Section
            components.push({
                type: "section",
                title: `Deleted Message (AutoMod)`,
                description: "AutoMod has deleted an offending message.",
                thumbnail: pfp,
            });

            if (msg === null) {

                // No Message?
                components.push({
                    type: "text",
                    content: `**Message related content could not be retrieved.**`
                });
            } else {

                // Message Exists
                components.push({
                    type: "separator",
                    divider: true,
                    spacing: 1
                })
                components.push({
                    type: "text",
                    content: `**Original Content:**`
                });
                components.push({
                    type: "text",
                    content: `${msg.cleanContent?.slice(0, 1024) || "Unavailable"}`
                });

                components.push({
                    type: "separator",
                    divider: true,
                    spacing: 1
                })
                components.push({
                    type: "text",
                    content: `**Offending User:**`
                });
                components.push({
                    type: "text",
                    content: `${msg.author?.username ?? "Unknown"} (\`${msg.author?.id ?? "Unknown"}\`)`
                });
            }

            // Construct and send Containers
            return await sendLog("delmsg", components, modChannel);
        }
        case "info": {
            components.push({
                type: "section",
                title: `Info Event`,
                description: `${reason}`,
                thumbnail: pfp,
            });
            return await sendLog("info", components, modChannel);
        }
    }

    const actions = {
        ban: { title: 'Banned', verb: 'banned', color: 'ban' },
        unban: { title: 'Unbanned', verb: 'unbanned', color: 'pardon' },
        kick: { title: 'Kicked', verb: 'kicked', color: 'kick' },
        warn: { title: 'Warned', verb: 'warned', color: 'warn' },
        liftwarn: { title: 'Warning Lifted from', verb: 'lifted a warning from', color: 'pardon' },
        mute: { title: 'Muted', verb: 'muted', color: 'mute' },
        unmute: { title: 'Unmuted', verb: 'unmuted', color: 'pardon' }
    };

    const config = actions[type];

    if (!config) {
        console.error(`Unknown moderation event type: ${type}`);
        return;
    }

    let thumbnail = moderator?.displayAvatarURL?.();

    if (thumbnail) {
        thumbnail = {
            desc: moderator.id,
            url: thumbnail
        }
    } else {
        thumbnail = pfp
    }
    const targetName =
        targetUser?.username
        ?? targetUser?.id
        ?? "Unknown User";
    components.push({
        type: "section",
        title: `${config.title} User ${caseName}`,
        description: `${modName} ${config.verb} user ${targetName}`,
        thumbnail: thumbnail
    });

    components.push({
        type: "separator",
        divider: true,
        spacing: 1
    })
    components.push({
        type: "text",
        content: `**Reason:**`
    })
    components.push({
        type: "text",
        content: `${reason}`
    })
    return await sendLog(config.color, components, modChannel);
}

module.exports = {
    moderateContainer
}