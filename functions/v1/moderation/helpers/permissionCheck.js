
const { PermissionsBitField } = require("discord.js");

const actionPermissions = {
    ban: PermissionsBitField.Flags.BanMembers,
    kick: PermissionsBitField.Flags.KickMembers,
    mute: PermissionsBitField.Flags.ModerateMembers,
    unmute: PermissionsBitField.Flags.ModerateMembers,
    warn: PermissionsBitField.Flags.ManageMessages
};

const checkPerms = async function (interaction, action, targetUser, targetMember) {
    if (!interaction.inCachedGuild()) {
        return {
            error: true,
            desc: "This command only works in servers."
        };
    }

    const requiredPermission = actionPermissions[action];

    if (requiredPermission === undefined) {
        return {
            error: true,
            desc: "Unknown moderation action."
        };
    }

    const moderator = interaction.member;

    // Warnings require no additional Discord moderation permission.
    if (requiredPermission !== null &&
        !moderator.permissions.has(requiredPermission)) {
        return {
            error: true,
            desc: `You don't have permission to ${action} members.`
        };
    }

    if (requiredPermission !== null &&
        !interaction.appPermissions.has(requiredPermission)) {
        return {
            error: true,
            desc: `I don't have permission to ${action} members.`
        };
    }

    if (targetUser.id === interaction.user.id) {
        return {
            error: true,
            desc: "You cannot moderate yourself."
        };
    }

    // Role hierarchy checks.
    if (targetMember) {
        if (
            interaction.guild.ownerId !== moderator.id &&
            moderator.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0
        ) {
            return {
                error: true,
                desc: "You cannot moderate someone with an equal or higher role."
            };
        }

        // Discord permissions for actions performed by the bot.
        if (action === "ban" && !targetMember.bannable) {
            return {
                error: true,
                desc: "I cannot ban this member."
            };
        }

        if (action === "kick" && !targetMember.kickable) {
            return {
                error: true,
                desc: "I cannot kick this member."
            };
        }

        if (["mute", "unmute"].includes(action) &&
            !targetMember.moderatable) {
            return {
                error: true,
                desc: "I cannot timeout this member."
            };
        }
    }

    if (["kick", "mute", "unmute"].includes(action) && !targetMember) {
        return {
            error: true,
            desc: "That user is not in this server."
        };
    }

    return {
        error: false,
        desc: "Permission checks passed."
    };
};

module.exports = {
    checkPerms
};
