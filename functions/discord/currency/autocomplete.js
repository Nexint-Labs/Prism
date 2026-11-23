
const { getAPI, queryAPI } = require('#functions/discord/api/fetch');

// Get the catalog
const getCatalog = async function () {
    const result = await getAPI('/currency/shop');

    if (result.error) {
        throw new Error('Could not get item catalog.');
    }

    return result.content;
}

// Get owned consumable items
const getOwnedConsumables = async function (user, focused = '') {

    // Get catalog
    const catalog = await getCatalog();

    // Get inventory
    const result = await queryAPI('/currency/update/items', {
        userId: user.id
    });

    if (result.error) {
        throw new Error('Could not get inventory.');
    }

    const inventory = result.content;
    const choices = [];

    // Search for owned consumables
    for (const owned of inventory) {
        if (owned.value <= 0) {
            continue;
        }

        for (const item of catalog) {
            if (item.id != owned.name) {
                continue;
            }

            if (!item.effects?.consumable) {
                break;
            }

            if (!item.name.toLowerCase().includes(focused.toLowerCase())) {
                break;
            }

            choices.push({
                name: `${item.name} (${owned.value} owned)`.slice(0, 100),
                value: item.name
            });

            break;
        }

        if (choices.length >= 25) {
            break;
        }
    }

    return choices;
}

module.exports = {
    getCatalog,
    getOwnedConsumables
};
