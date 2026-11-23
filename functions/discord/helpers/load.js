const { loading } = require("#config/discord/visual/botAssets")
const { assertStrictArray, assertBoolean } = require("#functions/discord/core/assert")
const { replyContainer } = require("#functions/discord/container/replyContainer")

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