const { logMessage } = require('#functions/discord/moderation/messageLogging');
const { automodDeletedMessages } = require('#functions/discord/moderation/deletedMessages');
const { log } = require('#functions/core/log.mjs');

module.exports = {
    async execute(client) {
		// Enforce client
		if (!client) {
			return;
		}
        client.on("messageDelete", async (message) => {
            try {
                if (automodDeletedMessages.has(message.id)) {
                    automodDeletedMessages.delete(message.id);
                    return;
                }

                if (!message.guild) return;
                if (!message.author || message.author.bot) return;

                await logMessage(message, "delete");

            } catch (error) {
                log.error("Message delete moderation error:", error);
            }
        });
    }
};