const { MessageFlags } = require('discord.js');
const { createAdvancedContainer } = require('#functions/v2/discord/container');
const { blacklistServerCheck } = require('#functions/v2/auth/checkServerBlacklist');
const { client } = require('#bot');

const { sendMessage } = require('#functions/v2/discord/shardInfo');
const { botName } = require('#config/core/core');
const { inviteChannelID } = require('#config/core/discord');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    async execute() {
        client.on("guildCreate", async guild => {
            if (guild.name === undefined) return;

            const container = await createAdvancedContainer({
                color: "info",
                advert: false,
                copyright: true,
                components: [
                    {
                        type: "text",
                        content: `**Welcome to ${botName}Bot!**\n- Run /help to obtain help on how to use ${botName}Bot!\n- Join our support server for additional support! /support\n\nHave fun! :D`
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
                }
            } catch {
                try {
                    const owner = await guild.fetchOwner();
                    await owner.send({
                        components: [container],
                        flags: MessageFlags.IsComponentsV2
                    });
                } catch { }
            }

            if (inviteChannelID === undefined) return;

            try {
                await sendMessage(inviteChannelID, `Joined a new guild: ${guild.name} (ID: ${guild.id}) - Members: ${guild.memberCount}`);
            } catch (error) {
                console.error(error);
            }
        });

        client.on("guildDelete", async guild => {
            if (guild.name === undefined) return;
            if (inviteChannelID === undefined) return;

            try {
                await sendMessage(inviteChannelID, `Left guild: ${guild.name} (ID: ${guild.id}) - Members: ${guild.memberCount}`);
            } catch (error) {
                console.error(error);
            }
        });
    }
};