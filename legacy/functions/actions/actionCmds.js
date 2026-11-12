
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

/*
optOutAction function
Input: interaction
Output: true/false depending if opt out worked
*/
const optOutAction = async function (interaction) {
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
};

module.exports = {
    optOutAction,
};
