module.exports = {

    // Server
    apiName: "NexAPI", // API Name, change this to whatever you like
    apiServer: process.env.SERVER_URL ?? "", // no slash at the end
    apiToken: process.env.SERVER_TOKEN ?? "",
    header: process.env.SERVER_HEADER ?? "",
    delay: 300, // delay before checking servers (caching), idk if this issuse anywhere help
    advertChance: 0.1, // Chance of an advertisement (0 - 1)
    notifChance: 0.1, // Chance of a notification
}