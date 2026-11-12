// NexAPI adapter; preserves existing MikuBot function signatures.
const { request, member } = require('#functions/v2/currency/apiRead');

const queryMulti = (
    user,
    name,
    multiplier,
    findName,
    expire,
    transaction = null
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('queryMulti', {
        ...member(user),
        name,
        multiplier,
        findName,
        expire,
    });
};

const updateMulti = (user, transaction = null) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('updateMulti', member(user));
};

module.exports = {
    queryMulti,
    updateMulti,
};