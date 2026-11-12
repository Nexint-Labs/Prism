const { Events, AuditLogEvent } = require("discord.js");
const { client } = require("#bot");
const { moderateContainer } = require('#functions/v2/moderation/moderateContainer');

module.exports = {
    async execute() {

        client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {

            const moderator = entry.executor ??
                await client.users.fetch(entry.executorId).catch(() => null) ??
                { id: entry.executorId };

            const targetUser = entry.target ?? { id: entry.targetId };
            if (entry.executorId === client.user.id) return;

            try {
                switch (entry.action) {
                    case AuditLogEvent.MemberBanAdd: {
                        await moderateContainer(
                            guild.id,
                            "ban",
                            entry.reason ?? "No reason given.",
                            null,
                            moderator,
                            targetUser
                        );
                        break;
                    }

                    case AuditLogEvent.MemberBanRemove: {
                        await moderateContainer(
                            guild.id,
                            "unban",
                            entry.reason ?? "No reason given.",
                            null,
                            moderator,
                            targetUser
                        );
                        break;
                    }

                    case AuditLogEvent.MemberKick: {
                        await moderateContainer(
                            guild.id,
                            "kick",
                            entry.reason ?? "No reason given.",
                            null,
                            moderator,
                            targetUser
                        );
                        break;
                    }

                    default:
                        return;
                }
            } catch (error) {
                console.error("Audit log handler error:", error);
            }
        });
    }
};