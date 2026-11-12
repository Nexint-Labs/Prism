const { SlashCommandBuilder } = require('discord.js');
const { botName } = require('#config/core/core');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
		.setName('credits')
	    .setDescription(`${botName}Bot Credits!`)
	    .setIntegrationTypes([0,1])
	    .setContexts([0,1,2]),
    async execute(interaction) {
        
        // Credits for MikuBot
        let msg = "";
        msg += "- Jesus Christ, our Lord and Savior"
        msg += "\n- @mtriita on twitter for the bot PFP + Banner!"
        msg += "\n- https://seka.ing for some event related stuff (real)"
        msg += "\n- @Nexint on YT (main developer)"
        msg += "\n- You, for using this bot! (Thank you for the support <3)"

        // Send reply
        await replyContainer(
            interaction,
            "Credits",
            [msg],
            "Default",
            null,
            {ephemeral: true, checkNotif: false, copyright: false, advert: false}
        )
        return;
    }
};