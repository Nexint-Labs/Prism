// NexAPI adapter; preserves the existing MikuBot function signatures.
const { request, member } = require('#functions/v2/currency/apiRead');

const queryItem = (itemId, user) => {
    return request('queryItem', {
        ...(user ? member(user) : {}),
        itemId,
    });
};

const queryItemName = (name, user) => {
    return request('queryItemName', {
        ...(user ? member(user) : {}),
        name,
    });
};

const updateItemAtomic = (
    user,
    itemId,
    qtyChange,
    transaction = null
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('updateItemAtomic', {
        ...member(user),
        itemId,
        qtyChange,
    });
};

const queryInventory = user => {
    return request('queryItem', member(user));
};

module.exports = {
    queryItem,
    queryItemName,
    updateItemAtomic,
    queryInventory,
};