const { queryAPI } = require("../api/fetch");
// This entire function needs to be included in NexAPI.
// Returns true if opted out, false if not.
const optOutChk = async function (firstMember, secondMember) {
    const result = await queryAPI("/opt-out", {
        firstId: firstMember.id,
        secondId: secondMember.id
    })
    return result.content
}

// Returns true if opted out, false if not.
const optOutChkSingle = async function (firstMember) {
    const result = await queryAPI("/opt-out", {
        firstId: firstMember.id
    })
    return result.content
}

module.exports = {
    optOutChk,
    optOutChkSingle
};