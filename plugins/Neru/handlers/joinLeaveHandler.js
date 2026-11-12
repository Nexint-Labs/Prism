const { client } = require('#bot');
const { joinMessage, leaveMessage } = require("#preload/dbs/moderation");

const channelMessage = async function (ids, member) {

    const channel = member.guild.channels.cache.get(ids.channelId)
        ?? await member.guild.channels.fetch(ids.channelId).catch(() => null);

    if (!channel?.isTextBased()) return;

    // hmm interesting
    let user = member.toString();
    let userName = member.user?.username ?? member.displayName ?? member.id;
    let server = member.guild.name;
    let memberCount = member.guild.memberCount;
    let msg = "";
    for (let i = 0; i < ids.message.length; i++) {
        let tmpMsg = ids.message[i];
        if (ids.message[i] + ids.message[i + 1] == "${") {
            tmpMsg = ids.message[i];
            while (i < ids.message.length && ids.message[i] != "}") {
                i += 1;
                tmpMsg += ids.message[i];
            }
            switch (tmpMsg.toLowerCase()) {
                case "${user}":
                    tmpMsg = user;
                    break;
                case "${server}":
                    tmpMsg = server;
                    break;
                case "${membercount}":
                    tmpMsg = memberCount;
                    break;
                case "${username}":
                    tmpMsg = userName;
                    break;
            }
        }
        msg += tmpMsg;
    }
    return await channel.send(msg);

}

module.exports = {
    async execute() {
        client.on("guildMemberAdd", async member => {

            // Finds all whatevers of people that joined
            const joinList = await joinMessage.findAll({
                where: { guildId: member.guild.id }
            });

            // Map all joins onto a new results array, and execute all promises asyncronously.
            const results = await Promise.allSettled(
                joinList.map(config => channelMessage(config, member))
            );

            // Log errors
            for (const result of results) {
                if (result.status === "rejected") {
                    console.error("Welcome message failed:", result.reason);
                }
            }
        });

        // this is literally the same code as the code above bro what are we doing
        client.on("guildMemberRemove", async member => {
            const leaveList = await leaveMessage.findAll({
                where: {
                    guildId: member.guild.id
                }
            });

            // Map a list of leave memssages.
            const results = await Promise.allSettled(
                leaveList.map(config => channelMessage(config, member))
            );

            // Log errors
            for (const result of results) {
                if (result.status === "rejected") {
                    console.error("Leave message failed:", result.reason);
                }
            }
        })
    }
}