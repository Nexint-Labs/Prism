const { createAdvancedContainer } = require("#functions/v2/discord/container");

const moderationTypes = {
    ban: {
        title: "Banned",
        color: "ban",
        action: "banned"
    },
    unban: {
        title: "Unbanned",
        color: "info",
        action: "unbanned"
    },
    kick: {
        title: "Kicked",
        color: "kick",
        action: "kicked"
    },
    warn: {
        title: "Warned",
        color: "warn",
        action: "warned"
    },
    liftwarn: {
        title: "Warn Lifted",
        color: "warn",
        action: "cleared of a warning"
    },
    mute: {
        title: "Muted",
        color: "mute",
        action: "muted"
    },
    unmute: {
        title: "Unmuted",
        color: "info",
        action: "unmuted"
    }
};

const containerMaker = async function (interaction, reason, type) {
    const config = moderationTypes[type];

    if (!config) {
        throw new Error("Unknown moderation type");
    }

    return await createAdvancedContainer({
        color: config.color,
        advert: false,
        copyright: true,
        components: [
            {
                type: "section",
                title: config.title,
                description: `You have been ${config.action} in **${interaction.guild.name}**.`,
                thumbnail: {
                    desc: interaction.user.username,
                    url: interaction.user.displayAvatarURL()
                }
            },
            {
                type: "separator",
                divider: true,
                spacing: 1
            },
            {
                type: "text",
                content: `**Reason:**\n${reason}`
            }
        ]
    });
};

module.exports = { containerMaker };