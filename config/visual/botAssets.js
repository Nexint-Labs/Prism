const { botName, botFile } = require("#config/core/core")

// Just an alternate way to construct!
// This is pre-configured with my file host :P
const baseURL = "https://files.nexint.org"
const endpoint = "/api/public/dl/"
const key = "s8jr-OD9/"
const modifiers = "?inline=true"

const host = baseURL + endpoint + key

module.exports = {
    pfp: {
        desc: `${botName}bot PFP`,
        url: `${host}${botFile}${modifiers}`,
    },
    warning: {
        desc: `Warning`,
        url: `${host}blacklist.png${modifiers}`,
    },
    loading: {
        desc: `Loading`,
        url: `${host}loading_rainbow.webp${modifiers}`
    },
    miku:{
        desc: `Miku PFP`,
        url: `${host}miku.jpg${modifiers}`,
    }
}