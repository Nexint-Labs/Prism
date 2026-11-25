const { getConfig } = require("#functions/core/getConfig");

const { devName } = getConfig("core/core");
const { pluginName } = getConfig("cosmetic/config");
const { date } = require("#functions/core/date")
const { GatewayIntentBits, Partials, ActivityType } = require("discord.js");

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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [ // Partial events the bot subscribes to
        Partials.Channel,
        Partials.Message
    ],

    botActivity: "Thinking About You! | /help",
    botStatus: "online",
    botURL: "", // Bot's URL for streaming. Automatically credits me if the botType is streaming!
    botType: ActivityType.Playing,
    footerText: `${pluginName} © ${date.getFullYear()}. · By @${devName}`,
    inviteChannelID: process.env.INVITE_CHANNEL_ID ?? "", // Optional
}