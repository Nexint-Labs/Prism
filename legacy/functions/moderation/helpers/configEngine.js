const { queryChatRevive, deleteChatRevive, createChatRevive } = require("#functions/moderation/databaseQueries/addChatRevive");
const { queryJoinMessage, deleteJoinMessage, createJoinMessage } = require("#functions/moderation/databaseQueries/addJoinMessages");
const { queryLeaveMessage, deleteLeaveMessage, createLeaveMessage } = require("#functions/moderation/databaseQueries/addLeaveMessages");
const { queryModChannels, deleteModChannels, createModChannels } = require("#functions/moderation/databaseQueries/addModChannels");
const { queryModeration, allowModeration, denyModeration } = require("#functions/moderation/databaseQueries/addModerate");

const createConfigEngine = (interaction) => {
    const onSubmit = async (item, values) => {
        console.log("Setting:", item.id);
        console.log("New value:", values);

        switch (item.id) {
            case "moderation": {
                let listValues = "";
                let error = false;
                for (let i = 0; i < values.length; i++) {

                    // Null check
                    if (values[i] === null) {
                        listValues += `${item.value[i].id} has been left unchanged. Existing value: ${(await queryModeration(interaction, item.value[i].id)) ? "Blocked" : "Allowed"}\n`;
                        continue;
                    }

                    // do the actual DB query lol
                    let changedValue;
                    if (values[i]) {
                        changedValue = await denyModeration(interaction, item.value[i].id);
                    } else {
                        changedValue = await allowModeration(interaction, item.value[i].id);
                    }
                    listValues += changedValue.desc
                    listValues += "\n"
                    if (changedValue.error) {
                        error = true;
                    }
                }
                return {
                    error: error,
                    desc: listValues
                }
            }
            case "msglog":
            case "modlog": {
                const enabled = values[0];
                let channelId = values[1];
                if (channelId === null) {
                    channelId = interaction.channelId;
                }
                if (enabled) {
                    return await createModChannels(interaction, channelId, item.id);
                } else {
                    return await deleteModChannels(interaction, item.id);
                }
            }
            case "join": {
                const enabled = values[0];
                let message = values[1];
                if (message === null) {
                    message = "Welcome ${user}!"
                }
                let channelId = values[2];
                if (channelId === null) {
                    channelId = interaction.channelId;
                }
                if (enabled) {
                    return await createJoinMessage(interaction, channelId, message);
                } else {
                    return await deleteJoinMessage(interaction);
                }
            }
            case "revive": {
                const enabled = values[0];
                const reviveRole = values[1];
                let channelId = values[2];
                if (channelId === null) {
                    channelId = interaction.channelId;
                }
                const reviveTime = values[3];
                if (enabled) {
                    return await createChatRevive(interaction, channelId, reviveRole, reviveTime);
                } else {
                    return await deleteChatRevive(interaction);
                }
            }
            case "leave": {
                const enabled = values[0];
                let message = values[1];
                if (message === null) {
                    message = "Goodbye ${user}. (${username})"
                }
                let channelId = values[2];
                if (channelId === null) {
                    channelId = interaction.channelId;
                }
                if (enabled) {
                    return await createLeaveMessage(interaction, channelId, message);
                } else {
                    return await deleteLeaveMessage(interaction);
                }
            }
            default:
                return {
                    error: true,
                    desc: "No changes have been made."
                }
        }
    }

    const updateValues = async (definitionsOnly = false) => {

        // Statuses (placeholders for new users)

        // modStatus and modValues are for the moderation, special implementation
        // Others follow the schema: value: blank, status: blank
        const modStatus = {
            invites: "Invites: Unknown",
            links: "Links: Unknown",
            swears: "Swearing: Unknown",
            slurs: "Slurs: Unknown",
        }

        const modValues = {
            invites: "Do we block invites?",
            links: "Do we block links?",
            swears: "Do we block swearing?",
            slurs: "Do we block slurs?"
        }

        const modLog = {
            value: "No Moderation Log configured",
            status: "No Moderation Log configured"
        }

        const msgLog = {
            value: "No Message Log configured",
            status: "No Message Log configured"
        }

        const joinMessage = {
            value: "No Join Message configured",
            status: "No Join Message configured"
        }

        const leaveMessage = {
            value: "No Leave Message configured",
            status: "No Leave Message configured"
        }

        const chatRevive = {
            value: "No Chat Revive Message configured",
            status: "No Chat Revive Message configured"
        }

        // Definitions only?
        if (!definitionsOnly) {

            if (await queryModeration(interaction, "invite")) {
                modValues.invites += ` Invites are currently blocked.`
                modStatus.invites = "Invites: Blocked"
            } else {
                modValues.invites += ` Invites are currently allowed.`
                modStatus.invites = "Invites: Allowed"
            }

            if (await queryModeration(interaction, "links")) {
                modValues.links += " Links are currently blocked."
                modStatus.links = "Links: Blocked"
            } else {
                modValues.links += " Links are currently allowed."
                modStatus.links = "Links: Allowed"
            }

            if (await queryModeration(interaction, "swears")) {
                modValues.swears += " Swearing is currently blocked."
                modStatus.swears = "Swearing: Blocked"
            } else {
                modValues.swears += " Swearing is currently allowed."
                modStatus.swears = "Swearing: Allowed"
            }

            if (await queryModeration(interaction, "slurs")) {
                modValues.slurs += " Slurs are currently blocked."
                modStatus.slurs = "Slurs: Blocked"
            } else {
                modValues.slurs += " Slurs are currently allowed."
                modStatus.slurs = "Slurs: Allowed"
            }

            let modLogChannel = await queryModChannels(interaction, "modlog")
            if (modLogChannel !== null) {
                modLog.value = `<#${modLogChannel}>`;
                modLog.status = "Current Modlog Channel: " + modLog.value
            }

            let msgLogChannel = await queryModChannels(interaction, "msglog")
            if (msgLogChannel !== null) {
                msgLog.value = `<#${msgLogChannel}>`;
                msgLog.status = "Current Message Logging Channel: " + msgLog.value
            }

            let queryJoinMessages = await queryJoinMessage(interaction);
            if (queryJoinMessages !== null) {
                joinMessage.value = `\`${queryJoinMessages.message}\` in <#${queryJoinMessages.channelId}>`;
                joinMessage.status = "Current Join Message:\n" + joinMessage.value
            }

            let queryLeaveMessages = await queryLeaveMessage(interaction);
            if (queryLeaveMessages !== null) {
                leaveMessage.value = `\`${queryLeaveMessages.message}\` in <#${queryLeaveMessages.channelId}>`;
                leaveMessage.status = "Current Leave Message:\n" + leaveMessage.value;
            }

            let queryChatRevives = await queryChatRevive(interaction);
            if (queryChatRevives !== null) {
                chatRevive.value = `<@&${queryChatRevives.roleId}> in <#${queryChatRevives.channelId}>`;
                chatRevive.status = "Current Revive Ping:\n" + chatRevive.value
            }
        }
        let itemArray = [
            {
                title: "Moderation",
                desc: "Configure moderation specific stuff.",
                id: "moderation",
                value: [
                    {
                        type: "bool",
                        label: "Block Invites?",
                        desc: modValues.invites,
                        id: "invite",
                        required: false,
                    },
                    {
                        type: "bool",
                        label: "Block Links?",
                        desc: modValues.links,
                        id: "links",
                        required: false,
                    },
                    {
                        type: "bool",
                        label: "Block Swearing?",
                        desc: modValues.swears,
                        id: "swears",
                        required: false,
                    },
                    {
                        type: "bool",
                        label: "Block Slurs?",
                        desc: modValues.slurs,
                        id: "slurs",
                        required: false,
                    },
                ],
                displayValue: `Select this item to see.`,
                status: modStatus
            },
            {
                title: "Mod Logs",
                desc: "Configure moderation log.",
                id: "modlog",
                value: [
                    {
                        type: "bool",
                        label: "Enable modlog?",
                        desc: "Do we enable the moderation log?",
                        id: "enable",
                        required: true,
                    },
                    {
                        type: "str",
                        label: "Channel ID",
                        desc: "What channel ID do we use? Blank for current.",
                        id: "channel",
                        required: false,
                    },
                ],
                displayValue: modLog.value,
                status: modLog.status,
            },
            {
                title: "Message Logs",
                desc: "Configure the server wide message log.",
                id: "msglog",
                value: [
                    {
                        type: "bool",
                        label: "Enable message logs?",
                        desc: "Do we enable message logs?",
                        id: "enable",
                        required: true,
                    },
                    {
                        type: "str",
                        label: "Channel ID",
                        desc: "What channel ID do we use? Blank for current.",
                        id: "channel",
                        required: false,
                    },
                ],
                displayValue: msgLog.value,
                status: msgLog.status,
            },
            {
                title: "Join Messages",
                desc: "Configure join messages.\n\`${user}\` for user, \`${memberCount}\` for members, \`${server}\` for server name, \`${username}\` for the username of the user!",
                id: "join",
                value: [
                    {
                        type: "bool",
                        label: "Enable join messages?",
                        desc: "Do we enable the join messages?",
                        id: "enable",
                        required: true,
                    },
                    {
                        type: "str",
                        label: "Join Message",
                        desc: "The message sent when someone joins. Blank for placeholder.",
                        id: "message",
                        required: false,
                    },
                    {
                        type: "str",
                        label: "Channel ID",
                        desc: "What channel ID do we use? Blank for current.",
                        id: "channel",
                        required: false,
                    },
                ],
                displayValue: joinMessage.value,
                status: joinMessage.status,
            },
            {
                title: "Leave Messages",
                desc: "Configure leave messages.\n\`${user}\` for user, \`${memberCount}\` for members, \`${server}\` for server name, \`${username}\` for the username of the user!",
                id: "leave",
                value: [
                    {
                        type: "bool",
                        label: "Enable leave messages?",
                        desc: "Do we enable the leave messages?",
                        id: "enable",
                        required: true,
                    },
                    {
                        type: "str",
                        label: "Leave Message",
                        desc: "The message sent when someone leaves. Blank for placeholder.",
                        id: "message",
                        required: false,
                    },
                    {
                        type: "str",
                        label: "Channel ID",
                        desc: "What channel ID do we use? Blank for current.",
                        id: "channel",
                        required: false,
                    },
                ],
                displayValue: leaveMessage.value,
                status: leaveMessage.status,
            },
            {
                title: "Chat Revive",
                desc: "Configure chat revive messages.",
                id: "revive",
                value: [
                    {
                        type: "bool",
                        label: "Enable revive messages?",
                        desc: "Do we enable revive messages?",
                        id: "enable",
                        required: true,
                    },
                    {
                        type: "str",
                        label: "Revive Role ID",
                        desc: "What role ID to use?",
                        id: "role",
                        required: true,
                    },
                    {
                        type: "str",
                        label: "Channel ID",
                        desc: "What channel ID do we use? Blank for current.",
                        id: "channel",
                        required: false,
                    },
                    {
                        type: "str",
                        label: "Time?",
                        desc: "How long before the next revive is allowed?",
                        id: "duration",
                        required: true,
                    },
                ],
                displayValue: chatRevive.value,
                status: chatRevive.status,
            },
        ]
        return itemArray
    }

    return { onSubmit, updateValues };
};

const getConfigDefinitions = async function () {
    const { updateValues } = createConfigEngine(null);
    return await updateValues(true);
}

module.exports = { createConfigEngine, getConfigDefinitions };