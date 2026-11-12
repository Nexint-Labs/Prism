
const { chatLog, client } = require('#bot');
const { queryModChannels } = require('#functions/moderation/databaseQueries/addModChannels');
const {
    autoModAPI, clientId, spamDelete, spamLog, spamDelay,
    spamWarn, embedURL, embedIconURL, spamWarnReason,
    footerText, warnColor, delMsgColor, banColor, infoColor
} = require('#app-config');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
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

    switch (type) {
        case "edit": {

            const autoModEmbed = new EmbedBuilder()
                .setColor(infoColor)
                .setTitle('Edited Message')
                .setURL(embedURL)
                .setAuthor({
                    name: msg.author?.username ?? "Unknown User",
                    iconURL: msg.author?.displayAvatarURL() ?? embedIconURL,
                    url: type === "edit" ? msg.url : undefined
                })
                .setDescription("A message has been edited.")
                .addFields(
                    {
                        name: "Original content:",
                        value: oldMessage?.cleanContent?.slice(0, 1024) || "Unavailable"
                    },
                    {
                        name: "New content:",
                        value: msg.cleanContent?.slice(0, 1024) || "Unavailable"
                    },
                    {
                        name: "User:",
                        value: msg.author
                            ? `${msg.author} (${msg.author.id})`
                            : "Unknown User"
                    }
                )
                .setTimestamp()
                .setFooter({ text: footerText, iconURL: embedIconURL });
            await msgChannel.send({ embeds: [autoModEmbed] });
            return;
        }
        case "delete": {

            const autoModEmbed = new EmbedBuilder()
                .setColor(delMsgColor)
                .setTitle('Deleted Message')
                .setURL(embedURL)
                .setAuthor({
                    name: msg.author?.username ?? "Unknown User",
                    iconURL: msg.author?.displayAvatarURL() ?? embedIconURL,
                    url: type === "edit" ? msg.url : undefined
                })
                .setDescription("A message has been deleted.")
                .addFields(
                    {
                        name: "Content:",
                        value: msg.cleanContent?.slice(0, 1024) || "Unavailable"
                    },
                    {
                        name: "User:",
                        value: msg.author
                            ? `${msg.author} (${msg.author.id})`
                            : "Unknown User"
                    }
                )
                .setTimestamp()
                .setFooter({ text: footerText, iconURL: embedIconURL });
            await msgChannel.send({ embeds: [autoModEmbed] });
            return;
        }

        default:
            console.log("A major error has occured with a bot plugin!")
    }

}

module.exports = {
    logMessage,
}