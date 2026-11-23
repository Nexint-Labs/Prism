const { SlashCommandBuilder } = require('discord.js');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { pluginName } = require('#config/cosmetic/config');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
		.setName('credits')
	    .setDescription(`${pluginName}Bot Credits!`)
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