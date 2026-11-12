const { GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const { date, botName, devName } = require("#config/core/core");

module.exports = {

    // Discord Bot stuff
    // This config handles the Discord bot.

    // Bot stuff, including all API keys.
    discordToken: process.env.DISCORD_TOKEN, // Bot Token
    clientId: process.env.DISCORD_CLIENT_ID, // Bot Client ID
    devId: process.env.DEV_ID, // Dev ID
    devGuild: process.env.DEV_GUILD_ID, // dev guild ID
    intents: [ // Gateway events the bot subscribes to
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [ // Partial events the bot subscribes to
        Partials.Channel,
        Partials.Message
    ],

    botActivity: "Thinking About You! | /help",
    botStatus: "online",
    botURL: "", // Bot's URL for streaming. Automatically credits me if the botType is streaming!
    botType: ActivityType.Custom,
    footerText: `${botName} © ${date.getFullYear()}. · By @${devName}`,
    inviteChannelID: process.env.INVITE_CHANNEL_ID ?? "", // Optional

    // Archived

    // NOTE: EmbedURL and EmbedIconURL are now archived.
    // Please do not use these.
    embedURL: "https://nexint.ca/", // credits me in the embed, leave this blank if you want no URL
    embedIconURL: "https://files.nexint.org/api/public/dl/LVvxyDLX?inline=true", // This is now archived.
}