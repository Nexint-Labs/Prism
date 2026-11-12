const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
		.setName('testing-error')
	    .setDescription(`Testing error throwing!`)
	    .setIntegrationTypes([0,1])
	    .setContexts([0,1,2]),
    async execute(interaction) {
        
        // Credits for MikuBot
        throw new Error("Intentional Error - Reply")
        return;
    }
};