const { dmNotify } = require('#functions/discord/notify/dmNotify');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { User } = require('discord.js');
const { getUsername } = require('../core/getUsername');
const { postAPI } = require('../api/fetch');
const { log } = require("#functions/core/log.mjs");

/**
 * Gain EXP lol
 * @param {User} user 
 * @returns 
 */
const expGain = async function (user) {
    if (await optOutChkSingle(user)) {
        return 0;
    }

    const result = await postAPI('/currency/misc/exp', {
        userId: user.id,
        name: getUsername(user)
    })
    if (result.error) {
        return 0;
    }
    const exp = result.content;

    if (exp.newLevel > 0) {
        try {
            const result = await dmNotify(
                user,
                [`You gained an additional level!\nYou are now level ${exp.newLevel}.`],
            );

            if (result && result !== 0 && result.rawError?.message !== 'Cannot send messages to this user') {
                log.error(`A serious error has occured while gaining xp.`, result)
            }
        } catch (error) {
            log.error(`A serious error has occured while gaining xp.`, error)
        }
    }

    return user.newLevel;
}

module.exports = { expGain };
