const { client } = require('#bot');
const { moderateMessage } = require('#functions/v2/moderation/moderateMessage');

module.exports = {
    async execute() {
        client.on('messageCreate', async msg => {
            await moderateMessage(msg);
        });
    },
};