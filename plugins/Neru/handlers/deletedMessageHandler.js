const { client } = require('#bot');
const { logMessage } = require('#functions/v2/moderation/messageLogging');
const { automodDeletedMessages } = require('#functions/v2/moderation/deletedMessages');

module.exports = {
    async execute() {
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
                console.error("Message delete moderation error:", error);
            }
        });
    }
};