const abbrevBalance = async function (coins) {
    // interaction.user is the object representing the User who ran the command
    // interaction.member is the GuildMember object, which represents the user in the specific guild
    let coinCount = coins;
    let coinValue = coinCount;
    const coinValues = [
        // 10^3 through 10^30
        'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',

        // 10^33 through 10^60
        'Dc', 'UDc', 'DDc', 'TDc', 'QaDc',
        'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc',

        // 10^63 through 10^90
        'Vg', 'UVg', 'DVg', 'TVg', 'QaVg',
        'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg',

        // 10^93 through 10^120
        'Tg', 'UTg', 'DTg', 'TTg', 'QaTg',
        'QiTg', 'SxTg', 'SpTg', 'OcTg', 'NoTg',

        // 10^123 through 10^150
        'Qag', 'UQag', 'DQag', 'TQag', 'QaQag',
        'QiQag', 'SxQag', 'SpQag', 'OcQag', 'NoQag',

        // 10^153 through 10^180
        'Qig', 'UQig', 'DQig', 'TQig', 'QaQig',
        'QiQig', 'SxQig', 'SpQig', 'OcQig', 'NoQig',

        // 10^183 through 10^210
        'Sxg', 'USxg', 'DSxg', 'TSxg', 'QaSxg',
        'QiSxg', 'SxSxg', 'SpSxg', 'OcSxg', 'NoSxg',

        // 10^213 through 10^240
        'Spg', 'USpg', 'DSpg', 'TSpg', 'QaSpg',
        'QiSpg', 'SxSpg', 'SpSpg', 'OcSpg', 'NoSpg',

        // 10^243 through 10^270
        'Ocg', 'UOcg', 'DOcg', 'TOcg', 'QaOcg',
        'QiOcg', 'SxOcg', 'SpOcg', 'OcOcg', 'NoOcg',

        // 10^273 through 10^300
        'Nog', 'UNog', 'DNog', 'TNog', 'QaNog',
        'QiNog', 'SxNog', 'SpNog', 'OcNog', 'NoNog'
    ];
    let j = 0;
    coinCount = coinCount * 100;
    if (!Number.isFinite(coinCount)) {
        return {
            displayValue: String(coins),
            value: coins
        };
    }
    while (coinCount > 99999 && j < coinValues.length) {
        coinCount = Math.floor(coinCount / 1000);
        coinValue = (coinCount / 100) + " " + coinValues[j]
        j += 1;
    }
    j = 0;
    while (coinCount < -99999 && j < coinValues.length) {
        coinCount = Math.ceil(coinCount / 1000);
        coinValue = (coinCount / 100) + " " + coinValues[j]
        j += 1;
    }
    if (!(isNaN(Number(coinValue)))) {
        coinValue = Math.floor(coinValue * 100) / 100
    }
    let values = {
        displayValue: coinValue,
        value: Math.floor(coins * 100) / 100
    }
    return values
}

module.exports = {
    abbrevBalance,
};