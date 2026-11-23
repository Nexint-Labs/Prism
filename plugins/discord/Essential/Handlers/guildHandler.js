const { MessageFlags } = require('discord.js');
const { createAdvancedContainer } = require('#functions/discord/container/container');
const { blacklistServerCheck } = require('#functions/discord/auth/checkServerBlacklist');

const { sendMessage } = require('#functions/discord/container/shardInfo');
const { inviteChannelID } = require('#config/discord/discord');
const { pluginName } = require('#config/cosmetic/config');
const { log } = require('#functions/core/log.mjs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


const handleGuildCreate = async function (client, guild) {

    if (guild.name === undefined) return;

    const container = await createAdvancedContainer({
        color: "info",
        advert: false,
        copyright: true,
        components: [
            {
                type: "text",
                content: `**Welcome to ${pluginName}Bot!**\n- Run /help to obtain help on how to use ${pluginName}Bot!\n- Join our support server for additional support! /support\n\nHave fun! :D`
            }
        ]
    });

    const blacklisted = await blacklistServerCheck(guild.id);
    if (blacklisted) {
        await delay(1000);
        await guild.leave();
        return;
    }

    try {
        if (guild.systemChannel?.isSendable()) {
            await guild.systemChannel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } else {
            const owner = await guild.fetchOwner();
            await owner.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }
    } catch (error) {
        log.error("Could not send message", error);
    }

    if (inviteChannelID === undefined) return;

    try {
        await sendMessage(inviteChannelID, `Joined a new guild: ${guild.name} (ID: ${guild.id}) - Members: ${guild.memberCount}`, client);
    } catch (error) {
        log.error("Could not send message", error);
    }
}

const handleGuildDelete = async function (client, guild) {
    if (guild.name === undefined) return;
    if (inviteChannelID === undefined) return;

    try {
        await sendMessage(inviteChannelID, `Left guild: ${guild.name} (ID: ${guild.id}) - Members: ${guild.memberCount}`, client);
    } catch (error) {
        log.error("Could not send message", error);
    }

}

module.exports = {
    async execute(client) {
        // Enforce client
        if (!client) {
            return;
        }

        client.on("guildCreate", async guild => {
            void handleGuildCreate(client, guild).catch(error => {
                log.error("Unhandled guildCreate handler error.", error);
            });
        });

        client.on("guildDelete", async guild => {
            void handleGuildDelete(client, guild).catch(error => {
                log.error("Unhandled guildDelete handler error.", error);
            });
        });
    }
};