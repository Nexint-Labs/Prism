const { request, member } = require('#functions/v2/currency/apiRead');

const CATALOG_TTL = 5 * 60 * 1000;

let catalogCache = null;
let catalogExpires = 0;
let catalogPending = null;

async function getCatalog() {
    if (catalogCache && Date.now() < catalogExpires) {
        return catalogCache;
    }

    if (!catalogPending) {
        catalogPending = request('getItemCatalog', {})
            .then(result => {
                if (!Array.isArray(result)) {
                    throw new Error('INVALID_ITEM_CATALOG');
                }

                catalogCache = result;
                catalogExpires = Date.now() + CATALOG_TTL;

                return result;
            })
            .finally(() => {
                catalogPending = null;
            });
    }

    return catalogPending;
}

async function getOwnedConsumables(user, focused = '') {
    const [catalog, inventory] = await Promise.all([
        getCatalog(),
        request('queryItem', member(user))
    ]);

    if (!Array.isArray(inventory)) {
        throw new Error('INVALID_INVENTORY');
    }

    const catalogMap = new Map(
        catalog.map(item => [String(item.id), item])
    );

    const search = focused.toLowerCase();

    return inventory
        .filter(item => Number(item.value) > 0)
        .map(item => {
            const catalogItem = catalogMap.get(String(item.name));

            if (!catalogItem?.effects?.consumable) {
                return null;
            }

            return {
                name: `${catalogItem.name} (${item.value} owned)`.slice(0, 100),
                value: catalogItem.name
            };
        })
        .filter(Boolean)
        .filter(item =>
            item.name.toLowerCase().includes(search)
        )
        .slice(0, 25);
}

module.exports = {
    getCatalog,
    getOwnedConsumables
};