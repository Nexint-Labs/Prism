
const {
    autoModAPI, clientId, spamDelete, spamLog, spamDelay,
    spamWarn, embedURL, embedIconURL, spamWarnReason,
    footerText, warnColor, delMsgColor, banColor, infoColor,
    kickColor,
    muteColor
} = require('#app-config');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const embedMaker = async function(interaction, reason, type){
    switch (type) {
        case "ban": {
            return banEmbed(interaction, reason);
        }
        case "unban": {
            return unbanEmbed(interaction, reason);
        }
        case "kick": {
            return kickEmbed(interaction, reason);
        }
        case "warn": {
            return warnEmbed(interaction, reason);
        }
        case "liftwarn": {
            return liftWarnEmbed(interaction, reason);
        }
        case "mute": {
            return muteEmbed(interaction, reason);
        }
        case "unmute": {
            return unmuteEmbed(interaction, reason);
        }
        default:
            throw new Error("Unknown Embed Type")
    }
}

const banEmbed = async function (interaction, reason) {
    const banEmbed = new EmbedBuilder()
        .setColor(banColor)
        .setTitle(`Banned`)
        .setURL(embedURL)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL(), url: null })
        .setDescription(`You have been banned from **${interaction.guild.name}**`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return banEmbed
}

const unbanEmbed = async function (interaction, reason) {
    const banEmbed = new EmbedBuilder()
        .setColor(infoColor)
        .setTitle(`Unbanned`)
        .setURL(embedURL)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL(), url: null })
        .setDescription(`You have been unbanned from **${interaction.guild.name}**`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return banEmbed
}

const kickEmbed = async function (interaction, reason) {
    const kickEmbed = new EmbedBuilder()
        .setColor(kickColor)
        .setTitle(`Kicked`)
        .setURL(embedURL)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL(), url: null })
        .setDescription(`You have been kicked from **${interaction.guild.name}**`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return kickEmbed
}

const warnEmbed = async function (interaction, reason) {
    const warnEmbed = new EmbedBuilder()
        .setColor(warnColor)
        .setTitle(`Warned`)
        .setURL(embedURL)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL(), url: null })
        .setDescription(`You have been warned from **${interaction.guild.name}**`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return warnEmbed
}

const liftWarnEmbed = async function (interaction, reason) {
    const warnEmbed = new EmbedBuilder()
        .setColor(warnColor)
        .setTitle(`Warn Lifted`)
        .setURL(embedURL)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL(), url: null })
        .setDescription(`Your warning has been lifted from **${interaction.guild.name}**`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return warnEmbed
}

const muteEmbed = async function (interaction, reason) {
    const muteEmbed = new EmbedBuilder()
        .setColor(muteColor)
        .setTitle(`Muted`)
        .setURL(embedURL)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL(), url: null })
        .setDescription(`You have been muted from **${interaction.guild.name}**`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return muteEmbed
}

const unmuteEmbed = async function (interaction, reason) {
    const muteEmbed = new EmbedBuilder()
        .setColor(infoColor)
        .setTitle(`Unmuted`)
        .setURL(embedURL)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL(), url: null })
        .setDescription(`You have been unmuted from **${interaction.guild.name}**`)
        .addFields(
            {
                name: 'Reason:',
                value: `${reason}`
            },
        )
        .setThumbnail(embedURL)
        // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    return muteEmbed
}

module.exports = {
    embedMaker
}