const { SlashCommandBuilder } = require('discord.js');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
		.setName('gospel')
	    .setDescription('Gives a link to the Christian Gospel')
	    .setIntegrationTypes([0,1])
	    .setContexts([0,1,2]),
    async execute(interaction) {
        
        // Gospel message
        await replyContainer(
            interaction,
            "Gospel",
            ["Check out the Christian Gospel here!","https://the-gospel.xyz"],
            "Default",
            null,
            {ephemeral: true, checkNotif: false, copyright: false, advert: false}
        )
        return;
    }
};