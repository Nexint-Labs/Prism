
const {
    modv2,
    moderationCases,
    moderationCounters
} = require("#preload/dbs/moderation");

const createModerationCase = async function (interaction, type, targetId, reason = null) {
    try {
        const result = await modv2.transaction(async transaction => {
            const guildId = interaction.guildId;

            const [counter] = await moderationCounters.findOrCreate({
                where: { guildId },
                defaults: { lastCaseId: 0 },
                transaction
            });

            await counter.increment("lastCaseId", {
                by: 1,
                transaction
            });

            await counter.reload({ transaction });

            return await moderationCases.create({
                guildId,
                caseId: counter.lastCaseId,
                type,
                targetId,
                moderatorId: interaction.user.id,
                reason
            }, { transaction });
        });

        return {
            error: false,
            desc: `Moderation case #${result.caseId} has been created.`,
            case: result
        };

    } catch (error) {
        return {
            error: true,
            reason: error,
            desc: "Failed to create moderation case. " + error.name
        };
    }
};

const queryModerationCases = async function (interaction, targetId = null, type = null) {
    try {
        const where = {
            guildId: interaction.guildId
        };

        if (targetId !== null) {
            where.targetId = targetId;
        }

        if (type !== null) {
            where.type = type;
        }

        const cases = await moderationCases.findAll({
            where,
            order: [["caseId", "DESC"]]
        });

        return {
            error: false,
            desc: `Found ${cases.length} moderation cases.`,
            cases
        };

    } catch (error) {
        return {
            error: true,
            reason: error,
            desc: "Failed to query moderation cases. " + error.name
        };
    }
};

const liftModerationCase = async function (interaction, caseId) {
    try {
        const [updated] = await moderationCases.update({
            liftedAt: new Date(),
            liftedBy: interaction.user.id
        }, {
            where: {
                guildId: interaction.guildId,
                caseId,
                type: "warn",
                liftedAt: null
            }
        });

        if (!updated) {
            return {
                error: true,
                desc: `Active warning case #${caseId} was not found.`
            };
        }

        return {
            error: false,
            desc: `Warning case #${caseId} has been lifted.`
        };

    } catch (error) {
        return {
            error: true,
            reason: error,
            desc: "Failed to lift moderation case. " + error.name
        };
    }
};

module.exports = {
    createModerationCase,
    queryModerationCases,
    liftModerationCase
};
