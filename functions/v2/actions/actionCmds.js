
const { Op } = require('sequelize');

const {
    hugs,
    pat,
    hello,
    boop,
    poke,
    punch,
    kill,
    action,
} = require('#preload/dbs/funDBs'); // Adjust relative path

/**
 * Opt out action
 * This will be implemented soon.
 * @param {import('discord.js').Interaction} interaction 
 * @returns 
 */
const optOutAction = async function (interaction) {
    return true;
    /*
    try {
        const userId = interaction.user.id;

        // Legacy models. Remove these when fully migrated.
        const legacyModels = [
            [hugs, 'huggedId'],
            [pat, 'pattedId'],
            [hello, 'helloId'],
            [boop, 'boopId'],
            [poke, 'pokeId'],
            [punch, 'punchId'],
            [kill, 'killId'],
        ];

        for (const [model, targetField] of legacyModels) {
            await model.destroy({
                where: {
                    [Op.or]: [
                        { userId },
                        { [targetField]: userId },
                    ],
                },
            });
        }

        // New generalized action model.
        await action.destroy({
            where: {
                [Op.or]: [
                    { userId },
                    { actionId: userId },
                ],
            },
        });

        return true;
    } catch (error) {
        console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] An error has occurred while trying to opt out ${interaction.user}.`);
        console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] Full stack trace:`);
        console.error(error);

        return false;
    }
        */
};

module.exports = {
    optOutAction,
};
