/*

Archived due to MC server no longer exists.

const { SlashCommandBuilder } = require('discord.js');
const { addCommandsUsed } = require('#functions/usageData');
const { embed } = require('#functions/embed');
const { checkBlacklist } = require('#functions/blacklist');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your Discord account to Minecraft')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The 6-digit pin from /nexapi link')
                .setRequired(true))
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {
        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) return;

        const enteredPin = interaction.options.getString('code');
        const discordUserID = interaction.user.id;

        try {
            // Send the network check request to your separate Express server app
            const { header, server, serverToken } = require('#app-config');
            const verifyRes = await fetch(server + '/api/v1/discord/verify-code', {
                method: 'POST',
                headers: {
                    'Authorization': header,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: enteredPin,
                    token: serverToken
                })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.status === 200 && verifyData.success) {
                const mcUUID = verifyData.uuid;
                const mcUsername = verifyData.username;

                const addRes = await fetch(server + '/api/v1/discord/add-code', {
                    method: 'POST',
                    headers: {
                        'Authorization': header,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mcUUID: mcUUID,
                        discordUserID: discordUserID,
                        token: serverToken
                    })
                });

                const addData = await addRes.json();

                if ((addRes.status === 200 || addRes.status === 201) && addData.success) {
                    addCommandsUsed(interaction.user);
                    return await interaction.editReply({
                        content: `🎉 Successfully linked! Your Discord account is now bound to Minecraft player **${mcUsername}**.`
                    });
                } else {
                    return await interaction.editReply({
                        content: `❌ Link failed: ${addData.error || addData.message || "Unknown validation issue."}`
                    });
                }
            } else {
                return await interaction.editReply({
                    content: `❌ Link failed: ${verifyData.error || verifyData.message || "Invalid or expired pin code."}`
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