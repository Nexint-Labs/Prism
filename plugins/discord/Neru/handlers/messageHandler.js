const { log } = require('#functions/core/log.mjs');
const { moderateMessage } = require('#functions/discord/moderation/moderateMessage');

module.exports = {
    async execute(client) {
        // Enforce client
        if (!client) {
            return;
        }
        client.on('messageCreate', msg => {
            void moderateMessage(msg).catch(error => {
                log.error("Unhandled moderation error.", error);
            });
        });
    },
};