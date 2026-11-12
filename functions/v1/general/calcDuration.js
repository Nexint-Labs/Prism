const calcDuration = function (input) {
    const units = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400
    };

    const text = input.trim().toLowerCase();
    const unit = text.slice(-1);
    const amount = Number(text.slice(0, -1));

    if (!Object.hasOwn(units, unit)) return null;

    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) return null;

    const seconds = amount * units[unit];

    if (!Number.isSafeInteger(seconds) || seconds > 28 * 86400) {
        return null;
    }

    return seconds;
}

module.exports = {
    calcDuration,
};