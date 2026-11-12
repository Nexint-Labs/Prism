// THIS RELIES ON THE NEXINT API
// NEXINT API IS AUTHENTICATION ONLY
const { header, serverToken, server } = require('#app-config');
const { upstashPublisher } = require("#preload/redis/redis"); // Adjust matching your local layout script path
const { apiRequest } = require('#functions/apiClient');

async function getEcoBal(discordUserID) {
    try {
        const res = await apiRequest('/api/v1/discord/get-code', {
            mcUUID: null,
            discordUserID: discordUserID
        });

        if (!res.ok || !res.data.success) {
            return {
                status: "fail",
                content: res.data.error || res.data.message || "Your Discord account is not linked."
            };
        }

        const balRes = await apiRequest('/api/v1/players/balance', {
            uuid: res.data.mcUUID
        });

        if (!balRes.ok) {
            return {
                status: "fail",
                content: "Unable to retrieve Minecraft balance."
            };
        }

        return {
            status: "success",
            balance: balRes.data.balance,
            name: balRes.data.username
        };
    } catch (err) {
        return {
            status: "fail",
            content: "Network exception communicating with backend API."
        };
    }
}

async function setEcoBal(discordUserID, absoluteBalance) {
    try {
        const linkRes = await apiRequest('/api/v1/discord/get-code', {
            mcUUID: null,
            discordUserID: discordUserID
        });

        if (!linkRes.ok || !linkRes.data.success) {
            return {
                status: "fail",
                content: linkRes.data.error || "Account not linked."
            };
        }
        const transactionId = `DISCORD-DELTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const recRes = await apiRequest('/api/v1/players/reconcile-balance', {
            uuid: linkRes.data.mcUUID,
            username: linkRes.data.mcUsername || "DiscordUser",
            delta: absoluteBalance,
            transactionId: transactionId,
            isOverride: true,
            originServer: "Discord-Bot"
        });

        if (!recRes.ok || recRes.data.status !== "SUCCESS") {
            return {
                status: "fail",
                content: recRes.data.error || "Failed to set balance."
            };
        }

        return {
            status: "success",
            balance: recRes.data.currentBalance
        };
    } catch (err) {
        return {
            status: "fail",
            content: "Network error during monetary balance override."
        };
    }
}

/**
 * ✅ NEW: Atomic Delta Modifier Function Method
 * Applies incremental adjustments (positive or negative) without doing pre-queue math in the bot.
 */
async function changeEcoBal(discordUserID, deltaAmount) {
    try {
        const linkRes = await apiRequest('/api/v1/discord/get-code', {
            mcUUID: null,
            discordUserID: discordUserID
        });

        if (!linkRes.ok || !linkRes.data.success) {
            return {
                status: "fail",
                content: linkRes.data.error || "Account not linked."
            };
        }

        // Generate a unique idempotency transaction token to protect the database layer
        const transactionId = `DISCORD-DELTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const recRes = await apiRequest('/api/v1/players/reconcile-balance', {
            uuid: linkRes.data.mcUUID,
            username: "Discord-Bot",
            delta: deltaAmount,
            transactionId: transactionId,
            originServer: "Discord-Bot"
        });

        if (!recRes.ok || recRes.data.status !== "SUCCESS") {
            return {
                status: "fail",
                content: recRes.data.error || "Failed to alter balance."
            };
        }

        return {
            status: "success",
            balance: recRes.data.currentBalance
        };
    } catch (err) {
        return {
            status: "fail",
            content: "Network error during monetary balance modification."
        };
    }
}

module.exports = {
    getEcoBal,
    setEcoBal,
    changeEcoBal, // ✅ EXPORTED METHOD
};