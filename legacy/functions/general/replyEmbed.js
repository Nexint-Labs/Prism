const { embed } = require("#functions/general/embed")
const { followUpNotif } = require('#functions/notify/checkNotifs');
const { MessageFlags } = require("discord.js");

/**
 * Sends a standard embed response directly to a Discord interaction.
 * ah yes
 */
const replyEmbed = async function (interaction, title, description, url = null, shortURL = null, ephemeral = false, followUp = true) {
    const msgEmbed = await embed(title, description, url, shortURL);
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
            embeds: [msgEmbed],
            components: []
        });
    } else {
        await interaction.reply({
            embeds: [msgEmbed],
            components: [],
            flags: ephemeral ? MessageFlags.Ephemeral : undefined
        });
    }

    if (followUp) {
        return await followUpNotif(interaction, false);
    } else {
        return;
    }
};

/**
 * Sends a quick error/warning embed response directly to a Discord interaction
 */
const replyError = async function (interaction, description) {
    return await replyEmbed(interaction, "Error", description);
};

/**
 * Follow up reply lol
 */
const followUpReply = async function (interaction, title, description, url = null, shortURL = null) {
    let msg = await embed(title, description, url, shortURL)
    let options = {
        embeds: [msg],
        components: [],
        withResponse: true,
        withReply: true,
        flags: MessageFlags.Ephemeral
    };
    if (interaction.replied || interaction.deferred) {
        return await interaction.followUp(options);
    }
}

module.exports = {
    replyEmbed,
    replyError,
    followUpReply
}