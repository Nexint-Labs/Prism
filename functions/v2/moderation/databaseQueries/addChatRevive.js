
const { PermissionFlagsBits } = require('discord.js');
const { Op } = require('sequelize');
const { chatRevive } = require('#preload/dbs/moderation');
const { calcDuration } = require('#functions/v2/helpers/calcDuration');

const createChatRevive = async function (
    interaction,
    channelId,
    roleId,
    reviveTime
) {
    try {
        const guild = interaction.guild;
        if (!guild) {
            return {
                error: true,
                desc: 'This feature is only available in servers.'
            };
        }

        const channel = await guild.channels.fetch(channelId)
            .catch(() => null);

        if (!channel || !channel.isTextBased() || !('send' in channel)) {
            return {
                error: true,
                desc: 'That channel does not exist or cannot receive messages.'
            };
        }

        const member = await guild.members.fetchMe();
        const permissions = channel.permissionsFor(member);

        if (!permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages
        ])) {
            return {
                error: true,
                desc: 'I cannot send messages in that channel.'
            };
        }

        const role = await guild.roles.fetch(roleId)
            .catch(() => null);

        if (!role || role.id === guild.id) {
            return {
                error: true,
                desc: 'That is not a valid mentionable role.'
            };
        }

        if (!permissions.has(PermissionFlagsBits.MentionEveryone)) {
            return {
                error: true,
                desc: 'I need the Mention Everyone permission to ping the revive role.'
            };
        }

        const cooldownSeconds = calcDuration(reviveTime);

        if (cooldownSeconds === null) {
            return {
                error: true,
                desc: 'Invalid duration. Use formats like 30s, 15m, 2h, or 1d (maximum 28 days).'
            };
        }

        // Preserve the previous cooldown timestamp when editing.
        const existing = await chatRevive.findByPk(guild.id);

        if (existing) {
            await existing.update({
                channelId,
                roleId,
                cooldownSeconds
            });
        } else {
            await chatRevive.create({
                guildId: guild.id,
                channelId,
                roleId,
                cooldownSeconds,
                lastRevivedAt: 0
            });
        }

        return {
            error: false,
            desc: `Chat revival configured!
Channel: <#${channelId}>
Role: <@&${roleId}>
Cooldown: ${reviveTime}`
        };
    } catch (error) {
        return {
            error: true,
            reason: error,
            desc: `Failed to configure chat revival: ${error.name}`
        };
    }
};

const deleteChatRevive = async function (interaction) {
    try {
        const count = await chatRevive.destroy({
            where: { guildId: interaction.guildId }
        });

        return {
            error: false,
            desc: count
                ? 'Chat revival has been disabled.'
                : 'Chat revival is already disabled.'
        };
    } catch (error) {
        return {
            error: true,
            reason: error,
            desc: `Failed to disable chat revival: ${error.name}`
        };
    }
};

const queryChatRevive = async function (interaction) {
    const config = await chatRevive.findByPk(interaction.guildId);

    if (!config) return null;

    return config
};

// Claim a revival only if the cooldown has expired.
// The conditional UPDATE prevents simultaneous requests
// from both claiming the same cooldown.
const claimChatRevive = async function (interaction) {
    const config = await chatRevive.findByPk(interaction.guildId);

    if (!config) {
        return {
            error: true,
            desc: 'Chat revival is not enabled in this server.'
        };
    }

    if (interaction.channelId !== config.channelId) {
        return {
            error: true,
            desc: `Chat revival is only available in <#${config.channelId}>.`
        };
    }

    const now = Math.floor(Date.now() / 1000);
    const nextAvailable = Number(config.lastRevivedAt)
        + config.cooldownSeconds;

    if (now < nextAvailable) {
        return {
            error: true,
            desc: `Chat revival is available <t:${nextAvailable}:R>.`
        };
    }

    const [updated] = await chatRevive.update(
        { lastRevivedAt: now },
        {
            where: {
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                lastRevivedAt: {
                    [Op.lte]: now - config.cooldownSeconds
                }
            }
        }
    );

    if (!updated) {
        const latest = await chatRevive.findByPk(interaction.guildId);

        if (!latest) {
            return {
                error: true,
                desc: 'Chat revival has been disabled.'
            };
        }

        return {
            error: true,
            desc: `Chat revival is available <t:${Number(latest.lastRevivedAt) + latest.cooldownSeconds
                }:R>.`
        };
    }

    return {
        error: false,
        roleId: config.roleId,
        nextAvailable: now + config.cooldownSeconds
    };
};

module.exports = {
    createChatRevive,
    deleteChatRevive,
    queryChatRevive,
    claimChatRevive
};
