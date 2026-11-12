const { joinMessage } = require("#preload/dbs/moderation")
const { PermissionFlagsBits } = require("discord.js");
const createJoinMessage = async function (interaction, channelId, message) {
    try {

        // Query if the Discord channel exists.
        const channel = await interaction.guild.channels.fetch(channelId)
            .catch(() => null);

        if (!channel) {
            return {
                error: true,
                desc: "That channel does not exist in this server."
            };
        }

        if (
            !channel.isTextBased() ||
            !channel.permissionsFor(interaction.guild.members.me)
                ?.has([
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages
                ])
        ) {
            return {
                error: true,
                desc: "I cannot send messages in that channel."
            };
        }

        // Create / update the channel.
        await joinMessage.upsert({
            guildId: interaction.guildId,
            channelId: channelId,
            message: message,
        });
        return {
            error: false,
            desc: `Saved the join message in <#${channelId}>!\nMessage: ${message}`
        };

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return {
                error: false,
                desc: "Join messages already exist in this channel."
            }
        }
        return {
            error: true,
            reason: error,
            desc: "An unspecified error has occured. " + error.name
        }
    }
}

const deleteJoinMessage = async function (interaction) {
    const message = await queryJoinMessage(interaction)
    const rowCount = await joinMessage.destroy({
        where: {
            guildId: interaction.guildId,
        }
    });

    if (!rowCount) {

        return {
            error: false,
            desc: "Join messages does not exist in this channel."
        }
    }
    return {
        error: false,
        desc: "Deleted the join message: " + message + `, for the channel: <#${interaction.channelId}>`
    }
}

const queryJoinMessage = async function (interaction) {
    const result = await joinMessage.findOne({
        where: {
            guildId: interaction.guildId,
        }
    });

    return result ? result : null;
}

module.exports = {
    createJoinMessage,
    deleteJoinMessage,
    queryJoinMessage,
}