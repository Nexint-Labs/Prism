const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
		.setName('support')
	    .setDescription('Need support? Here\'s our support server!')
	    .setIntegrationTypes([0,1])
	    .setContexts([0,1,2]),
    async execute(interaction) {

        // Support message
        await replyContainer(
            interaction,
            "Support",
            [
                `Check out our Discord support server here!`,
                "https://discord.nexint.ca/"
            ],
            "default",
            null,
            {
                advert: false,
                ephemeral: true,
            }
        )
        return;
    }
};