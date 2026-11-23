const { moderateMessage } = require('#functions/discord/moderation/moderateMessage');

module.exports = {
    async execute(client) {
		// Enforce client
		if (!client) {
			return;
		}
        client.on('messageCreate', async msg => {
            await moderateMessage(msg);
        });
    },
};