// NexAPI adapter for wallet operations.
// Preserves existing MikuBot function signatures.
const { request, member } = require('#functions/currency/apiRead');

const balanceCheck = (user) => {
    return request('balanceCheck', member(user));
};

const queryBalances = () => {
    return request('queryBalances', {});
};

const convNameToID = (name) => {
    return request('convNameToID', {
        name,
    });
};

const updateBalanceAtomic = (
    user,
    amountChange,
    transaction = null
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('updateBalanceAtomic', {
        ...member(user),
        amountChange,
    });
};

module.exports = {
    balanceCheck,
    queryBalances,
    convNameToID,
    updateBalanceAtomic,
};