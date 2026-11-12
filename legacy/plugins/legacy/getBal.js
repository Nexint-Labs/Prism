/*

THIS FUNCTION IS ALREADY PRESENT IN CURRENCY WHAT ARE WE DOING CHAT

bro this function does not need to exist

we are so cooked

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkBlacklist } = require('#functions/blacklist');
const { header, serverToken, server } = require('#app-config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance-mc')
        .setDescription("Check a player's network economy balance"),

    async execute(interaction) {
        // Defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) return;

        const discordUserID = interaction.user.id;
        const { header, serverToken } = require('#app-config');
        let response2 = await fetch(server + '/api/v1/discord/get-code', {
            method: 'POST',
            headers: {
                'Authorization': header,
                'Content-Type': `application/json`
            },
            body: JSON.stringify({
                mcUUID: null,
                discordUserID: discordUserID,
                token: serverToken
            })
        });
        const data = await response2.json();
        console.log(data);

        if (response2.status === 200 && data.success) {

            const playerUuid = data.mcUUID;

            const { header, serverToken } = require('#app-config');

            try {
                // 2. Fetch data directly from your Sequelize API balance route
                response2 = await fetch(server + '/api/v1/players/balance', {
                    method: 'POST',
                    headers: {
                        'Authorization': header,
                        'Content-Type': `application/json`
                    },
                    body: JSON.stringify({
                        uuid: playerUuid,
                        token: serverToken
                    })
                });

                const data = await response2.json();

                // 3. Handle standard HTTP error gates from Node.js
                if (response2.status === 404) {
                    return await interaction.editReply({
                        content: `❌ **Lookup Failed:** Player data profile not found for UUID: \`${playerUuid}\`.`
                    });
                }

                if (response2.status !== 200) {
                    return await interaction.editReply({
                        content: `❌ **API Error:** Backend server responded with status code \`${response2.status}\`.`
                    });
                }

                // 4. Construct a clean Discord Rich Embed to display the balance beautifully
                const balanceEmbed = new EmbedBuilder()
                    .setColor(0x00AA00) // Minecraft dark green color
                    .setTitle(`💰 Economy Profile: ${data.username}`)
                    .addFields(
                        { name: '👤 Username', value: `\`${data.username}\``, inline: true },
                        { name: '💳 Wallet Balance', value: `**$${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**`, inline: true }
                    )
                    .setFooter({ text: 'NexAPI Network Sync Engine' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [balanceEmbed] });

            } catch (error) {
                console.error("Discord balance lookup link crashed:", error);
                return await interaction.editReply({
                    content: "❌ **Network Error:** Failed to establish a connection link to the primary API server."
                });
            }
        } else {
            // Returns the detailed 404 or 400 error string parsed by Express
            return await interaction.editReply({
                content: `❌ Link failed: ${data.error || "Unknown validation issue."}`
            });
        }
    }
};

*/