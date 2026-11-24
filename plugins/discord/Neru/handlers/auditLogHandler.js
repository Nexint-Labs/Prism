const { Events, AuditLogEvent } = require("discord.js");
const { moderateContainer } = require('#functions/discord/moderation/moderateContainer');
const { log } = require("#functions/core/log.mjs");

module.exports = {
    async execute(client) {
		// Enforce client
		if (!client) {
			return;
		}

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
                log.error("Audit log handler error:", error);
            }
        });
    }
};