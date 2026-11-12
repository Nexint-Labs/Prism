const { dmNotify } = require('#functions/notify/dmNotify');
const { optOutChkSingle } = require('#functions/opt-out/optOut');

const { request, member } = require('#functions/currency/apiRead');

async function expGain(guildMember) {
    if (await optOutChkSingle(guildMember)) return 0;
    const xpResult = await request('expGain', member(guildMember));
    const leveledUp = xpResult.newLevel || 0;

    if (leveledUp > 0) {
        try {
            const result = await dmNotify(
                guildMember,
                `You gained an additional level!\nYou are now level ${leveledUp}.`,
                null,
                null
            );

            if (
                result &&
                result !== 0 &&
                result.rawError?.message !==
                    'Cannot send messages to this user'
            ) {
                console.error('[Currency XP] DM failed:', result);
            }
        } catch (error) {
            if (
                error.rawError?.message !==
                'Cannot send messages to this user'
            ) {
                console.error('[Currency XP] DM failed:', error);
            }
        }
    }

    return leveledUp;
}

module.exports = { expGain };
