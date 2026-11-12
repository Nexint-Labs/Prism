// NexAPI adapter for consumable inventory items.
const { request, member } = require('#functions/currency/apiRead');

const consumeSushi = (user, qty) => {
    return request('consumeSushi', {
        ...member(user),
        qty,
    });
};

const consumeMulti = (user, itemId, qty) => {
    return request('consumeMulti', {
        ...member(user),
        itemId,
        qty
    });
};

const consumeBanknotes = (user, qty) => {
    return request('consumeBanknotes', {
        ...member(user),
        qty,
    });
};

const consumeLootbox = (user, itemId, qty) => {
    return request('consumeLootbox', {
        ...member(user),
        itemId,
        qty,
    });
};

module.exports = {
    consumeSushi,
    consumeBanknotes,
    consumeLootbox,
    consumeMulti,
};