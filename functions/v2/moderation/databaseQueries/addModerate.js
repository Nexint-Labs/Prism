const { moderation } = require("#preload/dbs/moderation");

const allowModeration = async function (interaction, category) {
    const rowCount = await moderation.destroy({
        where: {
            guildId: interaction.guildId,
            category,
        }
    });

    if (!rowCount) {
        return {
            error: false,
            desc: `${category} are already allowed for this server.`
        };
    }

    return {
        error: false,
        desc: `${category} are now allowed for this server.`
    };
};

const denyModeration = async function (interaction, category) {
    try {
        await moderation.create({
            guildId: interaction.guildId,
            category,
        });

        return {
            error: false,
            desc: `${category} have been blocked for this server.`
        };

    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return {
                error: false,
                desc: `${category} have already been blocked for this server.`
            };
        }

        return {
            error: true,
            reason: error,
            desc: "An unspecified error has occurred. " + error.name
        };
    }
};

const queryModeration = async function (interaction, category) {
    const result = await moderation.findOne({
        where: {
            guildId: interaction.guildId,
            category,
        }
    });

    return result !== null;
};

module.exports = {
    allowModeration,
    denyModeration,
    queryModeration,
};