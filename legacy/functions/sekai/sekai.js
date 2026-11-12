const characterSelectPJSK = async function (char) {

    // Character switcher
    let character = "";
    switch (char) {
        case "ichika":
            character = "Ichika Hoshino";
            break;
        case "saki":
            character = "Saki Tenma";
            break;
        case "honami":
            character = "Honami Mochizuki";
            break;
        case "shiho":
            character = "Shiho Hinomori";
            break;
        case "minori":
            character = "Minori Hanasato";
            break;
        case "haruka":
            character = "Haruka Kiritani";
            break;
        case "airi":
            character = "Airi Momoi";
            break;
        case "shizuku":
            character = "Shizuku Hinomori";
            break;
        case "kohane":
            character = "Kohane Azusawa";
            break;
        case "an":
            character = "An Shiraishi";
            break;
        case "akito":
            character = "Akito Shinonome";
            break;
        case "toya":
            character = "Toya Aoyagi";
            break;
        case "tsukasa":
            character = "Tsukasa Tenma";
            break;
        case "emu":
            character = "Emu Otori";
            break;
        case "nene":
            character = "Nene Kusanagi";
            break;
        case "rui":
            character = "Rui Kamishiro";
            break;
        case "kanade":
            character = "Kanade Yoisaki";
            break;
        case "mafuyu":
            character = "Mafuyu Asahina";
            break;
        case "ena":
            character = "Ena Shinonome";
            break;
        case "mizuki":
            character = "Mizuki Akiyama";
            break;
    }
    return character;

}

module.exports = {
    characterSelectPJSK,
};