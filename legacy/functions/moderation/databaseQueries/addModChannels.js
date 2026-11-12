const { modChannels } = require("#preload/dbs/moderation")
const { PermissionFlagsBits } = require("discord.js");
const createModChannels = async function (interaction, channelId, category) {
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
        await modChannels.upsert({
            guildId: interaction.guildId,
            channelId: channelId,
            category
        });
        return {
            error: false,
            desc: `${category} has been set to <#${channelId}>!`
        };

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return {
                error: false,
                desc: `${category} logging is already configured for this channel.`
            }
        }
        return {
            error: true,
            reason: error,
            desc: "An unspecified error has occured. " + error.name
        }
    }
}

const deleteModChannels = async function (interaction, category) {
    const rowCount = await modChannels.destroy({
        where: {
            guildId: interaction.guildId,
            category
        }
    });

    if (!rowCount) {

        return {
            error: false,
            desc: `${category} logging is not configured for this channel.`
        }
    }
    return {
        error: false,
        desc: `${category} has been disabled for the channel: <#${interaction.channelId}>`
    }
}

const queryModChannels = async function (interaction, category) {
    const result = await modChannels.findOne({
        where: {
            guildId: interaction.guildId,
            category
        }
    });

    return result ? result.channelId : null;
};

module.exports = {
    createModChannels,
    deleteModChannels,
    queryModChannels,
}