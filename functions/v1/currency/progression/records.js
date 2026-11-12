// NexAPI adapter for miscellaneous and work records.
// Preserves the existing MikuBot function signatures.

const { request, member } = require('#functions/currency/apiRead');

const miscCheck = (user, transaction = null) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('miscCheck', member(user));
};

const workCheck = (user, transaction = null) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('workCheck', member(user));
};

module.exports = {
    miscCheck,
    workCheck,
};