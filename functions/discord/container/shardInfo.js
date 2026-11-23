/*
This entire file should be temporary, idk what relies on it.
*/
const { Message } = require('discord.js');

/**
 * Gets a specific guild
 * @param {String} guildID 
 * @returns 
 */
const getServer = async (guildID, client) => {
    // try to get guild from all the shards
    
    const req = await client.cluster.broadcastEval((c, id) => {
        const guild = c.guilds.cache.get(id);
        return guild ? { id: guild.id, name: guild.name, memberCount: guild.memberCount } : null;
    }, {
        context: guildID
    });

    // return Guild or null if not found
    return req.find(res => !!res) || null;
}

/**
 * Gets a certain UserID
 * @param {String} userID 
 * @returns 
 */
const getUser = async (userID, client) => {
    // Fetch a real Discord.js User in the calling cluster instead of transferring
    // a class instance over IPC. Force fetch to avoid a cluster-local cache miss.
    try {
        return await client.users.fetch(userID);
    } catch (error) {
        if (error.code === 10013 || error.code === 50035) return null;
        throw error;
    }
}

/**
 * Sends a message to a given channel.
 * 
 * @param {String} channelId 
 * @param {Message} msg 
 * @returns 
 */
const sendMessage = async (channelId, msg, client) => {
    let messageContent = msg;
    const sentArray = await client.cluster.broadcastEval(async (c, { channelId, messageContent }) => {
        const channel = c.channels.cache.get(channelId);
        if (channel && channel.isTextBased()) {
            await channel.send(messageContent);
            return true; // Indicate that the message was sent
        }
        return false; // Indicate that the message was not sent by this shard
    }, { context: { channelId, messageContent } }); // Pass the channelId as context

    // Check the results from all shards
    if (!sentArray.includes(true)) {
        return false;
    }
    return true;
}

module.exports = {
    getServer,
    getUser,
    sendMessage,
};