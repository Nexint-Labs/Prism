const {optOut} = require("#preload/dbs/databases");

// Deprecated.
const optOutIntChk = async function (guildMember, id) {
    let optedOut = false;
    const optOutList = await optOut.findAll({ attributes: ['author'] });
    optOutList.forEach(optOutID => {
        if (optOutID.author == guildMember.id) {
            optedOut = true;
        }
    })
    if (optedOut) {
        return -1;
    }
    return 0;
}

module.exports = {
    optOutIntChk,
};