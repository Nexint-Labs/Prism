const { embed } = require('#functions/v2/nexapi/compat');
const { apiServer: server, apiToken: serverToken, header } = require('#config/api/NexAPI');
const { botName } = require('#config/core/core');
const { devId: devID } = require('#config/core/discord');
const { client } = require('#bot');


module.exports = {
    async execute(interaction) {
        // defer Reply
        const embedMessage = await interaction.deferReply({
            withResponse: true,
        });

        // Blacklist / whitelist only works if you are connected to Nexint API.
        if (server != "https://api.nexint.org") {
            let msg = await embed("Warning", `This instance of ${botName} is not connected to the Nexint API.`, null, null);
            await interaction.editReply({
                embeds: [msg]
            });
            return;
        }

        if (!(interaction.user.id == devID)) {
            let msg = await embed("Whitelist API", "You are not authorized to use this tool.", null, null);
            await interaction.editReply({
                embeds: [msg], withResponse: true
            });
            return;
        }

        // define
        let userId = interaction.options.getString("user");
        let user = await client.users.fetch(userId);

        // fetch
        const update = await fetch(server + '/api/v1/blacklist', {
            method: 'DELETE',
            body: JSON.stringify({
                userId: userId,
                name: user.username,
                completed: false,
                token: serverToken,
            }),
            headers: {
                'Authorization': header,
                'Content-Type': `application/json`
            }
        });
        const event = await update.json();

        // reply
        let msg = "";
        if (update.status == "409") {
            msg += "User is already whitelisted."
        } else {
            msg += `Whitelisted <@${event.id}> (${event.name}) from Nexint services.`
        }
        msg = await embed("Whitelist API", msg, null, null);
        await interaction.editReply({
            embeds: [msg], withResponse: true
        });
        return;
    }
};
