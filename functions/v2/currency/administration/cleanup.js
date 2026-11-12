// NexAPI owns all currency account management.
const { request } = require('#functions/v2/currency/apiRead');

const reset = () => {
    return request('resetCurrency', {});
};

const deleteCurrencyAccount = (userId) => {
    return request('deleteCurrencyAccount', {
        userId,
    });
};

const optOutCurrency = async (interaction) => {
    try {
        return await deleteCurrencyAccount(interaction.user.id);
    } catch (error) {
        console.error(
            '[Currency] Opt-out deletion failed:',
            error
        );

        return false;
    }
};

module.exports = {
    reset,
    deleteCurrencyAccount,
    optOutCurrency,
};