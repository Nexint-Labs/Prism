const { client } = require('#bot');
const { LinkifyIt } = require("linkify-it");
const { queryModeration } = require("#functions/v2/moderation/databaseQueries/addModerate");
const { detectProfanity, detectSlurs } = require("#functions/v2/moderation/helpers/profanityFilter");
const { automodDeletedMessages } = require("#functions/v2/moderation/deletedMessages");
const { moderateContainer } = require('#functions/v2/moderation/moderateContainer');
const { delay } = require('#functions/v2/helpers/delay');
const { Message } = require('discord.js');
const linkify = new LinkifyIt({ fuzzyLink: true });

const whitelist = new Set([
    'tenor.com',
    'cdn.discordapp.com',
    'cdn.discord.com',
    'cdn.discord.gg',
    'media.discordapp.net'
]);

/**
 * Allowed URL
 * @param {String} url 
 * @returns 
 */
const isAllowedURL = (url) => {
    try {
        let parsed;
        if (url.includes('://')) {
            parsed = new URL(url)
        } else {
            parsed = new URL(`https://${url}`)
        }

        const hostname = parsed.hostname.toLowerCase();
        if (whitelist.has(hostname) || hostname === 'discord.com' && (parsed.pathname === '/channels' || parsed.pathname.startsWith('/channels/'))) {
            return true;
        } else {
            return false;
        }
    } catch {
        return false;
    }
};

/**
 * Delete a message
 * @param {Message} msg 
 * @returns 
 */
const deleteMessage = async function (msg) {

    if (msg.deletable) {
        automodDeletedMessages.add(msg.id);

        setTimeout(() => {
            automodDeletedMessages.delete(msg.id);
        }, 30000);

        try {
            await msg.delete();
            return true;
        } catch (error) {
            automodDeletedMessages.delete(msg.id);
            throw error;
        }
    }
    return false;

}

/**
 * Log a warning
 * @param {Message} msg 
 * @param {String} reason 
 * @returns 
 */
const logWarning = async function (msg, reason) {
    try {
        await moderateContainer(msg.guildId, "automod", reason, msg);
    } catch (error) {
        console.error("[AutoMod] Logging failed:", error);
    }
}


/**
 * Send a warning
 * @param {Message} msg 
 * @param {String} reason 
 * @returns 
 */
const sendWarning = async function (msg, reason) {
    try {
        const warning = await msg.channel.send(
            `${msg.author}, ${reason}`,
        );

        await delay(5000);
        await warning.delete().catch(() => { });
    } catch (error) {
        console.error("[AutoMod] Warning failed:", error);
    }
}


/**
 * Moderate a message
 * @param {Message} msg 
 * @returns 
 */
const moderateMessage = async function (msg) {
    if (msg.author.id != client.user.id && msg.guild != null && msg.author.bot == false) {
        // compatibility shim
        const interaction = {
            guildId: msg.guildId,
            channelId: msg.channelId
        }
        if (await inviteModerate(interaction, msg)) {
            return;
        };
        if (await linkModerate(interaction, msg)) {
            return;
        };
        if (await swearModerate(interaction, msg)) {
            return;
        }
        if (await slurModerate(interaction, msg)) {
            return;
        }
    }
}

const inviteModerate = async function (interaction, msg) {
    const invite = await queryModeration(interaction, "invite");
    if (!invite) {
        return false;
    }

    const links = linkify.match(msg.content) ?? [];

    const hasInvite = links.some(link => {
        try {
            const url = new URL(link.url);
            const hostname = url.hostname.toLowerCase();
            const pathname = url.pathname.toLowerCase();
            if (hostname === "discord.gg" || ((hostname === "discord.com" || hostname === "discordapp.com") && pathname.startsWith("/invite/")
                )) {
                return true
            } else {
                return false
            }
        } catch {
            return false;
        }
    });

    if (!hasInvite) {
        return false;
    }

    if (!await deleteMessage(msg)) {
        return false;
    }

    await logWarning(msg, "Message contained Discord Invite links.");
    await sendWarning(msg, "Invites are not allowed in this server!");

    return true;
};
const linkModerate = async function (interaction, msg) {

    let link = await queryModeration(interaction, "links")

    if (link) {

        const links = linkify.match(msg.content) ?? [];

        const hasBlockedLink = links.some(link =>
            !isAllowedURL(link.url)
        );

        if (!hasBlockedLink) {
            return false;
        }

        if (!await deleteMessage(msg)) {
            return false;
        }

        await logWarning(msg, "Message contained non-whitelisted links.");
        await sendWarning(msg, "Links are not allowed in this server!");

        return true;
    }

    return false;

}
const swearModerate = async function (interaction, msg) {
    let swears = await queryModeration(interaction, "swears")

    if (swears) {
        const swearDetect = detectProfanity(msg.content);
        if (swearDetect) {

            if (!await deleteMessage(msg)) {
                return false;
            }

            await logWarning(msg, "Message contained swearing.");
            await sendWarning(msg, "Swearing is not allowed in this server!");

            return true;

        }

        return false;
    }

    return false;
}
const slurModerate = async function (interaction, msg) {
    let slurs = await queryModeration(interaction, "slurs")

    if (slurs) {
        const slurDetect = detectSlurs(msg.content);
        if (slurDetect) {

            if (!await deleteMessage(msg)) {
                return false;
            }

            await logWarning(msg, "Message contained slurs.");
            await sendWarning(msg, "Slurs not allowed in this server!");

            return true;

        }

        return false;
    }

    return false;
}

module.exports = {
    inviteModerate,
    linkModerate,
    swearModerate,
    slurModerate,
    moderateMessage
}