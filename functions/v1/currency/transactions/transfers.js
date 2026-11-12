// NexAPI adapter for currency and inventory transfers.
// Preserves the existing MikuBot function signatures.

const { request, member } = require('#functions/currency/apiRead');

const transferBank = (
    user,
    amount,
    direction,
    transaction = null
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('transferBank', {
        ...member(user),
        amount,
        direction,
    });
};

const transferBalance = (
    sender,
    recipient,
    amount,
    transaction = null
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('transferBalance', {
        senderId: sender.id,
        senderName: sender.username,
        recipientId: recipient.id,
        recipientName: recipient.username,
        amount,
    });
};

const transferItem = (
    sender,
    recipient,
    itemId,
    qty,
    transaction = null
) => {
    if (transaction) {
        throw new Error('CROSS_API_TRANSACTION');
    }

    return request('transferItem', {
        senderId: sender.id,
        senderName: sender.username,
        recipientId: recipient.id,
        recipientName: recipient.username,
        itemId,
        qty,
    });
};

module.exports = {
    transferBank,
    transferBalance,
    transferItem,
};