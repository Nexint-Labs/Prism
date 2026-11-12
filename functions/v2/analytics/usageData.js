const { User } = require("discord.js");
const {usage, userinfo, cmdDate} = require("#preload/dbs/analytics");
const { optOutChkSingle } = require("#functions/v2/opt-out/optOut");

/**
 * Add commands used
 * This should really be moved to NexAPI later lol
 * @param {User} member 
 * @returns 
 */
const addCommandsUsed = async function (member) {
    let command;
    let user;
    if (!(await optOutChkSingle(member))) {
        await addCmd();
        command = await queryCommand();
        user = await queryUser(member);
        user.value += 1;
        command.value += 1;
        await command.save();
        await user.save();
    }
    return command;
}


/**
 * Query the commands?
 * Unknown
 * @returns 
 */
const queryCommand = async function () {
    await usage.sync();
    let command = await usage.findOne({
        where: {
            type: "command"
        }
    });
    if (command === null) {
        await usage.create({
            type: 'command',
            value: 0
        });
        command = await usage.findOne({
            where: {
                type: "command"
            }
        });
    }
    return command;
}

const queryUser = async function (member) {
    if (!(await optOutChkSingle(member))) {
        await userinfo.sync();
        let user = await userinfo.findOne({
            where: {
                userId: member.id
            }
        });
        if (user === null) {
            await userinfo.create({
                userId: member.id,
                name: member.username,
                value: 0,
                registerDate: Date.now(),
                lastUsed: Date.now()
            });
            user = await userinfo.findOne({
                where: {
                    userId: member.id
                }
            });
        }
        user.lastUsed = Date.now();
        if (user.name != member.username) {
            user.name = member.username;
        }
        await user.save();
        return user;
    } else {
        return null;
    }
}
const queryAllUsers = async function () {
    await userinfo.sync();
    let allUsers = await userinfo.findAll();
    return allUsers;
}

const optOutUsageData = async function (interaction) {
    try {

        // sync currency
        await userinfo.sync();

        // destroy currency
        await userinfo.destroy({ where: { userId: interaction.user.id } })

        return true;
    } catch {
        console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] An error has occured while trying to opt out ${interaction.user}.`);
        console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] Full stack trace:`);
        console.log(error);
        return false;
    }
}

const addCmd = async function () {
    await cmdDate.sync();
    await cmdDate.create({
        type: 'day',
        date: Date.now()
    });
    return;
}

const queryCmds = async function (type) {
    await cmdDate.sync();
    let cmds = await cmdDate.findAll({
        where: {
            type: type
        }
    });
    let cmdCount = 0;
    await cmds.forEach(async (cmd) => {
        if (cmd.type == "day" && (Date.now() - cmd.date) / (60*60*24 * 1000) > 1) {
            await cmd.destroy();
        } else {
            if (cmd.type == type) {
                cmdCount += 1;
            }
        }
    });
    return cmdCount;
}

module.exports = {
    addCommandsUsed,
    queryCommand,
    queryUser,
    queryAllUsers,
    optOutUsageData,
    queryCmds
};