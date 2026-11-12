// NexAPI item catalog adapters.
const { request } = require('#functions/v2/currency/apiRead');

const findItemById = async (id) => {
    return (await request('findItemById', {
        itemId: id,
    })) ?? undefined;
};

const findItemByName = async (name) => {
    return (await request('findItemByName', {
        name,
    })) ?? undefined;
};

// Legacy alias retained for compatibility.
const convItem = (id) => findItemById(id);

module.exports = {
    convItem,
    findItemById,
    findItemByName,
};