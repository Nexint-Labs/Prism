const { moderateMessage } = require('#functions/discord/moderation/moderateMessage');
const { logMessage } = require('#functions/discord/moderation/messageLogging');
const { log } = require('#functions/core/log.mjs');

module.exports = {
    async execute(client) {
		// Enforce client
		if (!client) {
			return;
		}
        client.on("messageUpdate", async (oldMessage, newMessage) => {
            try {
                if (newMessage.partial) {
                    await newMessage.fetch();
                }

                if (!newMessage.guild) return;
                if (!newMessage.author || newMessage.author.bot) return;

                if (!oldMessage.partial && oldMessage.content === newMessage.content) return;

                await moderateMessage(newMessage);
                await logMessage(newMessage, "edit", oldMessage);

            } catch (error) {
                log.error("Message update moderation error:", error);
            }
        });
    }
};