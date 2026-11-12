const { request } = require('#functions/currency/apiRead');

const openLootBox = (id, qty) => {
    return request('openLootBox', {
        itemId: id,
        qty,
    });
};

const getLootBox = (id) => {
    return request('getLootBox', {
        itemId: id,
    });
};

module.exports = {
    openLootBox,
    getLootBox,
};