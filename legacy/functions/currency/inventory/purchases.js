// NexAPI adapter; preserves the existing MikuBot function signature.
const { request, member } = require('#functions/currency/apiRead');

const buyItem = (itemId, user, qty, transaction = null) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('buyItem', {
        ...member(user),
        itemId,
        qty,
    });
};

module.exports = { buyItem };