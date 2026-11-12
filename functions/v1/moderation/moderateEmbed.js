
const { chatLog, client } = require('#bot');
const { queryModChannels } = require('#functions/moderation/databaseQueries/addModChannels');
const {
    autoModAPI, clientId, spamDelete, spamLog, spamDelay,
    spamWarn, embedURL, embedIconURL, spamWarnReason,
    footerText, warnColor, delMsgColor, banColor, infoColor,
    kickColor, muteColor
} = require('#app-config');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const moderateEmbed = async function (guildId, type, reason, msg = null, moderator, targetUser, caseId = null) {

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
    if(caseId !== null){
        caseName = `(Case ${caseId})`
    }

    switch (type) {
        case "automod": {

            if (msg === null) {
                await errorEmbed(`Something really wrong has happened in bot code.\nOriginal reason: ${reason}`, modChannel);
                return;
            }

            const autoModEmbed = new EmbedBuilder()
                .setColor(delMsgColor)
                .setTitle('Deleted Message')
                .setURL(embedURL)
                .setAuthor({ name: 'Automod', iconURL: embedIconURL, url: embedURL })
                .setDescription(`${reason}`)
                .setThumbnail(embedURL)
                .addFields(
                    {
                        name: 'Original content:',
                        value: `${msg.cleanContent?.slice(0, 1024) || "Unavailable"}`
                    },
                    {
                        name: 'Offending user:',
                        value: `\`${msg.author}\` (\`${msg.author.username}\`)`
                    }
                )
                // .setImage('https://i.imgur.com/AfFp7pu.png')
                .setTimestamp()
                .setFooter({ text: footerText, iconURL: embedIconURL });
            await modChannel.send({ embeds: [autoModEmbed] });
            return;
        }
        case "info": {
            await infoEmbed(reason, modChannel);
            return;
        }
        case "ban": {
            await banEmbed(moderator, targetUser, reason, modChannel, caseName);
            return;
        }
        case "unban": {
            await unbanEmbed(moderator, targetUser, reason, modChannel, caseName);
            return;
        }
        case "kick": {
            await kickEmbed(moderator, targetUser, reason, modChannel, caseName);
            return;
        }
        case "warn": {
            await warnEmbed(moderator, targetUser, reason, modChannel, caseName);
            return;
        }
        case "liftwarn": {
            await liftWarnEmbed(moderator, targetUser, reason, modChannel, caseName);
            return;
        }
        case "mute": {
            await muteEmbed(moderator, targetUser, reason, modChannel, caseName);
            return;
        }
        case "unmute": {
            await unmuteEmbed(moderator, targetUser, reason, modChannel, caseName);
            return;
        }
        default:
            console.log("A major error has occured with a bot plugin!")
    }
}

const errorEmbed = async function (reason, modChannel) {
    const errorEmbed = new EmbedBuilder()
        .setColor(banColor)
        .setTitle('Error Event')
        .setURL(embedURL)
        .setDescription(`${reason}`)
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [errorEmbed] });
    return;
}

const infoEmbed = async function (reason, modChannel) {
    const infoEmbed = new EmbedBuilder()
        .setColor(infoColor)
        .setTitle(`Info Event`)
        .setURL(embedURL)
        .setDescription(`${reason}`)
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [infoEmbed] });
    return;
}

const banEmbed = async function (moderator, targetUser, reason, modChannel, caseName) {
    const banEmbed = new EmbedBuilder()
        .setColor(banColor)
        .setTitle(`Banned User ${caseName}`)
        .setAuthor({
            name: moderator?.username ?? moderator?.id ?? "Unknown Moderator",
            iconURL: moderator?.displayAvatarURL?.() ?? embedIconURL,
            url: moderator?.id
                ? `https://discord.com/users/${moderator.id}`
                : embedURL
        })
        .setURL(embedURL)
        .setDescription(`Banned user ${targetUser.username ?? targetUser.id}`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [banEmbed] });
    return;
}

const unbanEmbed = async function (moderator, targetUser, reason, modChannel, caseName) {
    const unbanEmbed = new EmbedBuilder()
        .setColor(infoColor)
        .setTitle(`Unbanned User ${caseName}`)
        .setAuthor({
            name: moderator?.username ?? moderator?.id ?? "Unknown Moderator",
            iconURL: moderator?.displayAvatarURL?.() ?? embedIconURL,
            url: moderator?.id
                ? `https://discord.com/users/${moderator.id}`
                : embedURL
        })
        .setURL(embedURL)
        .setDescription(`Unbanned user ${targetUser.username ?? targetUser.id}`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [unbanEmbed] });
    return;
}

const kickEmbed = async function (moderator, targetUser, reason, modChannel, caseName) {
    const kickEmbed = new EmbedBuilder()
        .setColor(kickColor)
        .setTitle(`Kicked User ${caseName}`)
        .setAuthor({
            name: moderator?.username ?? moderator?.id ?? "Unknown Moderator",
            iconURL: moderator?.displayAvatarURL?.() ?? embedIconURL,
            url: moderator?.id
                ? `https://discord.com/users/${moderator.id}`
                : embedURL
        })
        .setURL(embedURL)
        .setDescription(`Kicked user ${targetUser.username ?? targetUser.id}`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [kickEmbed] });
    return;
}

const warnEmbed = async function (moderator, targetUser, reason, modChannel, caseName) {
    const warnEmbed = new EmbedBuilder()
        .setColor(warnColor)
        .setTitle(`Warned User ${caseName}`)
        .setAuthor({
            name: moderator?.username ?? moderator?.id ?? "Unknown Moderator",
            iconURL: moderator?.displayAvatarURL?.() ?? embedIconURL,
            url: moderator?.id
                ? `https://discord.com/users/${moderator.id}`
                : embedURL
        })
        .setURL(embedURL)
        .setDescription(`Warned user ${targetUser.username ?? targetUser.id}`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [warnEmbed] });
    return;
}

const liftWarnEmbed = async function (moderator, targetUser, reason, modChannel, caseName) {
    const warnEmbed = new EmbedBuilder()
        .setColor(infoColor)
        .setTitle(`Lifted Warning from user ${caseName}`)
        .setAuthor({
            name: moderator?.username ?? moderator?.id ?? "Unknown Moderator",
            iconURL: moderator?.displayAvatarURL?.() ?? embedIconURL,
            url: moderator?.id
                ? `https://discord.com/users/${moderator.id}`
                : embedURL
        })
        .setURL(embedURL)
        .setDescription(`Lifted warning from user ${targetUser.username ?? targetUser.id}`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [warnEmbed] });
    return;
}

const muteEmbed = async function (moderator, targetUser, reason, modChannel, caseName) {
    const muteEmbed = new EmbedBuilder()
        .setColor(muteColor)
        .setTitle(`Muted User ${caseName}`)
        .setAuthor({
            name: moderator?.username ?? moderator?.id ?? "Unknown Moderator",
            iconURL: moderator?.displayAvatarURL?.() ?? embedIconURL,
            url: moderator?.id
                ? `https://discord.com/users/${moderator.id}`
                : embedURL
        })
        .setURL(embedURL)
        .setDescription(`Muted user ${targetUser.username ?? targetUser.id}`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [muteEmbed] });
    return;
}

const unmuteEmbed = async function (moderator, targetUser, reason, modChannel, caseName) {
    const muteEmbed = new EmbedBuilder()
        .setColor(infoColor)
        .setTitle(`Unuted User ${caseName}`)
        .setAuthor({
            name: moderator?.username ?? moderator?.id ?? "Unknown Moderator",
            iconURL: moderator?.displayAvatarURL?.() ?? embedIconURL,
            url: moderator?.id
                ? `https://discord.com/users/${moderator.id}`
                : embedURL
        })
        .setURL(embedURL)
        .setDescription(`Unmuted user ${targetUser.username ?? targetUser.id}`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    await modChannel.send({ embeds: [muteEmbed] });
    return;
}

module.exports = {
    moderateEmbed
}