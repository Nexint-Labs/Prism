const { client } = require('#bot');
const { moderateMessage } = require('#functions/v2/moderation/moderateMessage');
const { logMessage } = require('#functions/v2/moderation/messageLogging');

module.exports = {
    async execute() {
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
                console.error("Message update moderation error:", error);
            }
        });
    }
};