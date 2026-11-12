const {optOut} = require("#preload/dbs/databases");

// Returns true if opted out, false if not.
const optOutChk = async function (firstMember, secondMember) {
    const optOutRecord = await optOut.findOne({
        where: {
            author: [
                firstMember.id,
                secondMember.id
            ],
        },
        attributes: ['author'],
    });

    return optOutRecord !== null;
}

// Returns true if opted out, false if not.
const optOutChkSingle = async function (firstMember) {
    const optOutRecord = await optOut.findOne({
        where: { author: firstMember.id },
        attributes: ['author'],
    });

    return optOutRecord !== null;
}

module.exports = {
    optOutChk,
    optOutChkSingle
};