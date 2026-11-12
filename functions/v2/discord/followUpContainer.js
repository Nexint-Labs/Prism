const { MessageFlags } = require("discord.js")
const { createContainer } = require("#functions/v2/discord/container");
const { assertObject, assertBoolean } = require("#functions/v2/core/assert");

/**
 * Follow Up Container
 * Sets up a simple follow up reply.
 * Default: not ephemeral, copyright, advert, no seperation
 * @param {import("discord.js").Interaction} interaction 
 * @param {String} title 
 * @param {Array} descArray 
 * @param {String} color 
 * @param {{desc: string, url: string} | null} [thumbnail=null]
 * @param {{ephemeral: boolean, checkNotif: boolean, copyright: Boolean, advert: boolean, separate: boolean}} [options=null]
 */
const followUpContainer = async function (interaction, title, descArray, color, thumbnail = null, options = null) {
    let ephemeral = true, checkNotif = false;
    if (options !== null) {
        assertObject(options, "Container Options");
        ephemeral = assertBoolean(options.ephemeral ?? ephemeral, "FollowUp Ephemeral");
        checkNotif = assertBoolean(options.checkNotif ?? checkNotif, "FollowUp Notification Check");
    }
    const container = await createContainer(title, descArray, color, thumbnail, options)
    if (ephemeral) {
        await interaction.followUp({
            components: [container],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
        })
    } else {
        await interaction.followUp({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        })
    }
}

module.exports = {
    followUpContainer
}