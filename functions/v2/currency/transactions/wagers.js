// NexAPI adapter for wager transactions.
// NexAPI owns wager settlement and balance modifications.

const { randomUUID } = require('node:crypto');
const { request, member } = require('#functions/v2/currency/apiRead');

const settleWager = (
    user,
    stake,
    payout,
    transaction = null,
    requestId = randomUUID()
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('settleWager', {
        ...member(user),
        stake,
        payout,
        requestId,
    });
};

const reserveWager = (user, stake, requestId) => {
    return request('reserveWager', {
        ...member(user),
        stake,
        requestId,
    });
};

const resolveWager = (user, stake, payout, requestId) => {
    return request('resolveWager', {
        ...member(user),
        stake,
        payout,
        requestId,
    });
};

module.exports = {
    settleWager,
    reserveWager,
    resolveWager,
};