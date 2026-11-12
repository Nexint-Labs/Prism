// NexAPI adapter for bank operations.
// Preserves the existing MikuBot function signatures.
const { request, member } = require('#functions/currency/apiRead');

const bankCheck = (user) => {
    return request('bankCheck', member(user));
};

const queryBanks = () => {
    return request('queryBanks', {});
};

const updateBankAtomic = (
    user,
    amountChange,
    transaction = null
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('updateBankAtomic', {
        ...member(user),
        amountChange,
    });
};

module.exports = {
    bankCheck,
    queryBanks,
    updateBankAtomic,
};