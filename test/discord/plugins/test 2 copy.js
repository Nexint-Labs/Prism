const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
		.setName('testing-2')
	    .setDescription(`Testing more components!`)
	    .setIntegrationTypes([0,1])
	    .setContexts([0,1,2]),
    async execute(interaction) {
        
        // Credits for MikuBot
        let msg = "";
        msg += "- This is a test of Components V2."

        // Send reply
        await replyContainer(
            interaction,
            "Testing",
            [msg, "Testing Seperation of multiple text boxes."],
            "Default",
            null,
            {ephemeral: true}
        )
        throw new Error("Intentional Error")
        return;
    }
};