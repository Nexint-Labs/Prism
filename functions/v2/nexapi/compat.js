const { EmbedBuilder } = require('discord.js');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

// Compatibility adapter for the old NexAPI commands.
const embed = async function (title, description, color, thumbnail) {
    const message = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || ' ');
    if (color) message.setColor(color);
    if (thumbnail) message.setThumbnail(thumbnail);
    return message;
};

const replyEmbed = async function (interaction, title, description) {
    return replyContainer(interaction, title, [description], 'default', null, {
        checkNotif: false,
        advert: false
    });
};

module.exports = { embed, replyEmbed };
