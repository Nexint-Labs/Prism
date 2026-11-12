const { invites } = require("#preload/dbs/moderation");
const { chatLog, client } = require('#bot');
const { LinkifyIt } = require("linkify-it");
const { queryModeration } = require("#functions/moderation/databaseQueries/addModerate");
const { detectProfanity, detectSlurs } = require("#functions/moderation/helpers/profanityFilter");
const { moderateEmbed } = require("#functions/moderation/moderateEmbed");
const { automodDeletedMessages } = require("#functions/moderation/deletedMessages");
const linkify = new LinkifyIt({ fuzzyLink: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const moderateMessage = async function (msg) {
    if (msg.author.id != client.user.id && msg.guild != null && msg.author.bot == false) {
        // compatibility shim
        const interaction = {
            guildId: msg.guildId,
            channelId: msg.channelId
        }
        if (await inviteModerate(interaction, msg)) {
            return;
        };
        if (await linkModerate(interaction, msg)) {
            return;
        };
        if (await swearModerate(interaction, msg)) {
            return;
        }
        if (await slurModerate(interaction, msg)) {
            return;
        }
    }
}

const deleteMessage = async function (msg) {

    if (msg.deletable) {
        automodDeletedMessages.add(msg.id);

        setTimeout(() => {
            automodDeletedMessages.delete(msg.id);
        }, 30000);

        try {
            await msg.delete();
        } catch (error) {
            automodDeletedMessages.delete(msg.id);
            throw error;
        }
    }

}

const inviteModerate = async function (interaction, msg) {

    let invite = await queryModeration(interaction, "invite")

    if (invite) {
        const inviteLinks = [
            "discord.gg/",
            "discord.com/invite/",
            "discordapp.com/invite/"
        ];

        const content = msg.content.toLowerCase();

        let hasInvite = false;

        for (const link of inviteLinks) {
            if (content.includes(link)) {
                hasInvite = true;
                break;
            }
        }

        if (hasInvite) {
            await deleteMessage(msg);

            await moderateEmbed(msg.guildId, "automod", "Message contained Discord Invite links.", msg);

            const warning = await msg.channel.send(
                `${msg.author}, Discord invites are not allowed in this server!`
            );

            await delay(5000);
            await warning.delete().catch(() => { });
        }

        return hasInvite;
    }
    return false;
}
const linkModerate = async function (interaction, msg) {

    const whitelist = [
        'tenor.com/',
        'cdn.discordapp.com/',
        'cdn.discord.com/',
        'cdn.discord.gg/',
        'media.discordapp.net',
        'discord.com/channels'
    ];

    let link = await queryModeration(interaction, "links")

    if (link) {

        if (!linkify.test(msg.content)) return;

        const content = msg.content.toLowerCase();

        for (const bypass of whitelist) {
            if (content.includes(bypass)) {
                return false;
            }
        }

        await deleteMessage(msg);

        await moderateEmbed(msg.guildId, "automod", "Message contained non-whitelisted links.", msg);

        const warning = await msg.channel.send(
            `${msg.author}, Links are not allowed in this server!`
        );

        await delay(5000);
        await warning.delete().catch(() => { });
    }

    return false;

}
const swearModerate = async function (interaction, msg) {
    let swears = await queryModeration(interaction, "swears")

    if (swears) {
        const swearDetect = detectProfanity(msg.content);
        if (swearDetect) {
            
            await deleteMessage(msg);

            await moderateEmbed(msg.guildId, "automod", "Message contained swearing.", msg);

            const warning = await msg.channel.send(
                `${msg.author}, Swearing is not allowed in this server!`
            );

            await delay(5000);
            await warning.delete().catch(() => { });

        }
    }
}
const slurModerate = async function (interaction, msg) {
    let slurs = await queryModeration(interaction, "slurs")

    if (slurs) {
        const slurDetect = detectSlurs(msg.content);
        if (slurDetect) {
            
            await deleteMessage(msg);

            await moderateEmbed(msg.guildId, "automod", "Message contained slurs.", msg);

            const warning = await msg.channel.send(
                `${msg.author}, Slurs are not allowed in this server!`
            );

            await delay(5000);
            await warning.delete().catch(() => { });

        }
    }

    /*
    // Scan for links, invites, blacklists, etc
    // If they exist, true, otherwise false.
    const [linkRecord, inviteRecord, blacklistRecord] = await Promise.all([
        links.findOne({ where: { channelId: channel.id } }),
        invites.findOne({ where: { channelId: channel.id } }),
        blacklist.findOne({ where: { channelId: channel.id } }),
    ]);

    const linkCheck = linkRecord !== null;
    const inviteCheck = inviteRecord !== null;
    const blacklistCheck = blacklistRecord !== null;
    // Does the moderation checks (help so much code)
    // Only done when dealing with server messages.
    // Skips moderation checks when messageCount > spamDelete
    let botMessage;
    if (msg.author.id != client.user.id && msg.guild != null && msg.author.bot == false) {
        if (autoModAPI == false) {
            if ((linkCheck || inviteCheck)) {

                // defines blacklisted and whitelisted links
                const linkEnds = ['.com', '.org', '.net', '.xyz', '.co', '.ca', '.gg']; // coverage for (some) link types
                const blacklist = ['https://', 'http://']; // block all links
                const blacklistInvites = ['discord.gg/', 'discord.com']; // block invite links
                const blacklistCustom = ['/invite'] // block specific directories in the covered link types (invite)
                const whitelist = ['tenor.com/', 'cdn.discordapp.com/', 'cdn.discord.com/', 'cdn.discord.gg/', 'media.discordapp.net', 'discord.com/channels']; // whitelist specific domains
                let blacklisted = false;
                let linkOrMessage = "invite";
                let linkOrMessageCaps = "Invite";

                // checks if the link is blacklisted
                for (let i = 0; i < blacklist.length; i++) {
                    if (msg.content.includes(blacklist[i]) && linkCheck) {
                        blacklisted = true;
                        linkOrMessage = "link";
                        linkOrMessageCaps = "Link";
                    }
                }
                for (let i = 0; i < blacklistInvites.length; i++) {
                    if (msg.content.includes(blacklistInvites[i]) && inviteCheck) {
                        blacklisted = true;
                    }
                }
                for (let i = 0; i < linkEnds.length; i++) {
                    for (let j = 0; j < blacklistCustom.length; j++) {
                        if (msg.content.includes(linkEnds[i] + blacklistCustom[j]) && inviteCheck) {
                            blacklisted = true;
                        }
                    }
                }
                if (blacklisted) {

                    // checks if the link is whitelisted (overrides blacklist)
                    let whitelisted = false;
                    for (let i = 0; i < whitelist.length; i++) {
                        if (msg.content.includes(whitelist[i])) {
                            whitelisted = true;
                        }
                    }
                    if (!whitelisted) {

                        // sends an event to the server and client log and attempts to delete the message
                        // for privacy reasons, server log is currently deprecated (non existant), but may be re-implemented at a future date.
                        if (modChannelBool) {
                            const inviteDeleteEmbed = new EmbedBuilder()
                                .setColor(delMsgColor)
                                .setTitle('Deleted Message')
                                .setURL(embedURL)
                                //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
                                .setDescription(`The ${linkOrMessage} \`${msg.cleanContent}\` has been deleted automatically.`)
                                .setThumbnail(embedURL)
                                .addFields({ name: 'Offending user:', value: `\`${msg.author}\` (\`${msg.author.username}\`)` })
                                // .setImage('https://i.imgur.com/AfFp7pu.png')
                                .setTimestamp()
                                .setFooter({ text: footerText, iconURL: embedIconURL });
                            await modChannel.send({ embeds: [inviteDeleteEmbed] });
                        }
                        if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                            // console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel \`${channel.id}\` (${channel.name}). The ${linkOrMessage} was: \`${msg.content}\`.`);
                            await msg.delete();
                            botMessage = await msg.channel.send(`${msg.author}, ${linkOrMessageCaps}s are not allowed here.`);
                        } else {
                            if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                botMessage = await msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the \"Manage Messages\" permission to enable this!");
                            }
                            // console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The link was: \`${msg.content}\`.`);
                            if (logged && logChannel.permissionsFor(logChannel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                await logChannel.send(`[WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel ${channel}, but the bot does not have the necessary permissions to delete messages. Please give me the \'Manage Messages\' permission to enable this! The link was: \`${msg.content}\`.`);
                            }
                        }
                    }
                }
            }

            // checks for blacklisted words
            if (blacklistCheck) {
                blacklistCheck = false;
                for (const blacklist of blacklists) {
                    if (blacklist.strict) {
                        if (msg.content.toLowerCase().includes(blacklist.word.toLowerCase())) {
                            blacklistCheck = true;
                        }
                    } else {
                        const whitespace = [' ', '\n', '\t'];
                        for (let i = 0; i < whitespace.length; i++) {
                            if (msg.content.normalize("NFKC").toLowerCase().includes(whitespace[i] + blacklist.word.toLowerCase() + whitespace[i]) || msg.content.normalize("NFKC").toLowerCase().includes(blacklist.word.toLowerCase() + whitespace[i]) || msg.content.normalize("NFKC").toLowerCase() == (blacklist.word.toLowerCase()) || msg.content.normalize("NFKC").toLowerCase().endsWith(blacklist.word.toLowerCase())) {
                                blacklistCheck = true;
                            }
                        }
                    }
                }

                // checks for a blacklist
                if (blacklistCheck) {
                    if (modChannelBool) {
                        const inviteDeleteEmbed = new EmbedBuilder()
                            .setColor(delMsgColor)
                            .setTitle('Deleted Message')
                            .setURL(embedURL)
                            //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
                            .setDescription(`The blacklisted word in the message \`${msg.cleanContent}\` has been deleted automatically.`)
                            .setThumbnail(embedURL)
                            .addFields({ name: 'Offending user:', value: `\`${msg.author}\` (\`${msg.author.username}\`)` })
                            // .setImage('https://i.imgur.com/AfFp7pu.png')
                            .setTimestamp()
                            .setFooter({ text: footerText, iconURL: embedIconURL });
                        await modChannel.send({ embeds: [inviteDeleteEmbed] });
                    }
                    if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                        // console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}). The word was: \`${msg.content}\`.`);
                        await msg.delete();
                        botMessage = await msg.channel.send(`${msg.author}, This word is blacklisted.`);
                    } else {
                        if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                            botMessage = await msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the manage messages permission to enable this!");
                        }
                        // console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The word was: \`${msg.content}\`.`);
                        if (logged && logChannel.permissionsFor(logChannel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                            await logChannel.send(`[WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel ${channel}, but the bot does not have the necessary permissions to delete or send messages. Please give me the \'Manage Messages\' permission to enable this! The word was: \`${msg.content}\`.`);
                        }
                    }
                }
            }
        } else {
            // Currently waiting for the actual auto-mod.
            if (logged && msg.author.id != clientId && logChannel.permissionsFor(logChannel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                await logChannel.send(`Note that the auto-mod API is enabled, but does not currently work. Please disable it in the config!`);
            }

        }
        await delay(spamDelay * 1000);
        if (botMessage != undefined) {
            await botMessage.delete();
        }
    }
        */
}

module.exports = {
    inviteModerate,
    linkModerate,
    swearModerate,
    slurModerate,
    moderateMessage
}