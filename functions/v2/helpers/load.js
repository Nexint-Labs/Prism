const { loading } = require("#config/visual/botAssets")
const { assertStrictArray, assertBoolean } = require("#functions/v2/core/assert")
const { replyContainer } = require("#functions/v2/discord/replyContainer")

/**
 * Loading Animation
 * Helper lol
 * @param {import("discord.js").Interaction} interaction 
 * @param {Array<String>} msg 
 * @param {Boolean} ephemeral
 */
const loadAnim = async function (interaction, msg, ephemeral) {
    assertStrictArray(msg, "Message Array", "string");
    assertBoolean(ephemeral, "Ephemeral Loading Animation")
    await replyContainer(
        interaction,
        "Loading",
        msg,
        "default",
        loading,
        {
            ephemeral,
            checkNotif: false,
            advert: false,
            separate: false
        }
    )
}

module.exports = {
    loadAnim
}