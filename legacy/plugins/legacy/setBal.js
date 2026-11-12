/*

Archived due to MC server no longer exists.

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { devMode, devMsg, devID } = require('#app-config');
const { checkBlacklist } = require('#functions/blacklist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbalance-mc')
        .setDescription("Forcefully set a player's network economy balance")
        .addNumberOption(option =>
            option.setName('amount').setDescription("The target balance amount").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ withResponse: true });
        const targetAmount = interaction.options.getNumber('amount');

        if (await checkBlacklist(interaction)) return;

        if (interaction.user.id != devID) { // turning off the gatekeep
            await interaction.editReply({
                content: "You are not the developer of this bot. This incident will be reported.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const discordUserID = interaction.user.id;
        const { header, serverToken } = require('#app-config');

        // 1. DISPATCH LINK ACCOUNT REGISTRY CODE LOOKUP
        const codeLookupResponse = await fetch(server + '/api/v1/discord/get-code', {
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

        // Use a distinct name: 'codeData'
        const codeData = await codeLookupResponse.json();
        console.log("[Discord Link Lookup Payload]:", codeData);

        if (codeLookupResponse.status === 200 && codeData.success) {
            const playerUuid = codeData.mcUUID;

            try {
                // 2. ATOMIC ABSOLUTE FORCE OVERWRITE POST CALL
                const balanceSetResponse = await fetch(server + '/api/v1/players/set-balance', {
                    method: 'POST',
                    headers: {
                        'Authorization': header,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        uuid: playerUuid,
                        amount: Number(targetAmount), // Ensure numeric float primitives configuration type
                        originServer: "Discord-Bot",
                        token: serverToken
                    })
                });

                // Use a distinct name: 'balanceData'
                const balanceData = await balanceSetResponse.json();
                console.log("[API Set Balance Output Payload]:", balanceData);

                if (balanceSetResponse.status === 200) {
                    return await interaction.editReply({
                        content: `✅ **Success!** Force-set UUID \`${playerUuid}\` balance to **$${targetAmount.toLocaleString()}**.`
                    });
                } else {
                    return await interaction.editReply({
                        content: `❌ **Modification Refused:** ${balanceData.message || "Unknown ledger conflict."}`
                    });
                }

            } catch (error) {
                console.error("Discord balance lookup link crashed:", error);
                return await interaction.editReply({
                    content: "❌ **Network Error:** Failed to establish a connection link to the primary API server."
                });
            }
        } else {
            return await interaction.editReply({
                content: `❌ **Link Failure:** ${codeData.error || "Your Discord profile is not properly linked to a Minecraft UUID profile entry registry row."}`
            });
        }
    }
};

*/