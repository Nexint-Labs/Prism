// Core file that runs basic stuff
let date = new Date();

module.exports = {
    devMode: false,
    devMsg: "This bot is running in dev mode. Developer functions are enabled.",
    devName: "Nexint",
    botName: "Prism",
    botFile: "Prism_PFP.webp",

    // These can be changed, but only if you know what you are doing.
    dateOptions: {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    },
    logFormat: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`, // Log format of the bot
    date,
    restart: "start start.bat", // Restart command. This would be different on a linux based system. It would be "sh start.sh".
    source: "https://github.com/Nexint-Labs/Prism"
}