/*

Archived due to MC server no longer exists.

const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/usageData');
const { embed } = require('#functions/embed');
const { checkBlacklist } = require('#functions/blacklist');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlink your Discord account to Minecraft')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {
        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) return;

        const discordUserID = interaction.user.id;

        try {
            // Send the network check request to your separate Express server app
            const { header, server, serverToken } = require('#app-config');
            const getRes = await fetch(server + '/api/v1/discord/get-code', {
                method: 'POST',
                headers: {
                    'Authorization': header,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mcUUID: null,
                    discordUserID: discordUserID,
                    token: serverToken
                })
            });

            const getData = await getRes.json();

            if (getRes.status === 200 && getData.success) {
                const targetMcUUID = getData.mcUUID;

                const delRes = await fetch(server + '/api/v1/discord/del-code', {
                    method: 'POST',
                    headers: {
                        'Authorization': header,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mcUUID: targetMcUUID,
                        discordUserID: discordUserID,
                        token: serverToken
                    })
                });

                const delData = await delRes.json();

                if (delRes.status === 200 && delData.success) {
                    addCommandsUsed(interaction.user);
                    return await interaction.editReply({
                        content: `🎉 Successfully unlinked your Minecraft profile!`
                    });
                } else {
                    return await interaction.editReply({
                        content: `❌ Link failed: ${delData.error || delData.message || "Unknown validation issue."}`
                    });
                }
            } else {
                return await interaction.editReply({
                    content: `❌ Link failed: ${getData.error || getData.message || "Your Discord account is not linked."}`
                });
            }

        } catch (error) {
            console.error("Communication breakdown with the API Server:", error);
            return await interaction.editReply({
                content: "❌ Failed to contact the backend validation server. Please try again later."
            });
        }
    },
};

*/