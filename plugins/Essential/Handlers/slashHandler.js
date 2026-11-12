const { Collection, Events, MessageFlags } = require('discord.js');
const { client } = require('#bot');
const { followUpContainer } = require('#functions/v2/discord/followUpContainer');
const { replyContainer } = require('#functions/v2/discord/replyContainer');

module.exports = {
	async execute() {
		client.on(Events.InteractionCreate, async interaction => {
			// Handle autocomplete interactions
			if (interaction.isAutocomplete()) {
				const command = client.commands.get(interaction.commandName);

				if (!command?.autocomplete) {
					await interaction.respond([]).catch(() => { });
					return;
				}

				try {
					await command.autocomplete(interaction);
				} catch (error) {
					console.error('[Autocomplete Error]', error);

					if (!interaction.responded) {
						await interaction.respond([]).catch(() => { });
					}
				}

				return;
			}

			// Existing command handling
			if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;
			const command = client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			const { cooldowns } = interaction.client;

			if (!cooldowns.has(command.data.name)) {
				cooldowns.set(command.data.name, new Collection());
			}

			const now = Date.now();
			const timestamps = cooldowns.get(command.data.name);
			const defaultCooldownDuration = 3;
			const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

			if (timestamps.has(interaction.user.id)) {
				const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

				if (now < expirationTime) {
					const expiredTimestamp = Math.round(expirationTime / 1000);
					return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
				}
			}

			timestamps.set(interaction.user.id, now);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

			try {
				await command.execute(interaction);
			} catch (error) {
				try {
					if (interaction.replied || interaction.deferred) {
						followUpContainer(
							interaction,
							"Error",
							[
								"Something went wrong while trying to process a command! Please report this to the bot dev.",
								`${error}`
							],
							"default",
							null,
							{
								ephemeral: true,
								advert: false,
								checkNotif: false,
							}
						)
					} else {
						replyContainer(
							interaction,
							"Error",
							[
								"Something went wrong while trying to process a command! Please report this to the bot dev.",
								`${error}`
							],
							"default",
							null,
							{
								ephemeral: true,
								advert: false,
								checkNotif: false,
							}
						)
					}
					console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] An error happened while processing a command!`);
					console.error(error);
				}
				catch (error) {
					throw (error);
				}
			}
		});
	}
}