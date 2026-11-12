const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { embed } = require('#functions/v2/nexapi/compat');
const { apiServer: server, header } = require('#config/api/NexAPI');
const { botName } = require('#config/core/core');
const { devId: devID } = require('#config/core/discord');


module.exports = {
    async execute(interaction) {
		// Defer reply
		const response = await interaction.deferReply({
			withResponse: true,
		});

        // Blacklist / whitelist only works if you are connected to Nexint API.
        if (server != "https://api.nexint.org") {
            let msg = await embed("Warning", `This instance of ${botName} is not connected to the Nexint API.`, null, null);
            await interaction.editReply({
                embeds: [msg]
            });
            return;
        }

        if (!(interaction.user.id == devID)) {
            let msg = await embed("Viewlist API", "You are not authorized to use this tool.", null, null);
            await interaction.editReply({
                embeds: [msg], withResponse: true
            });
            return;
        }

        // fetch
        const update = await fetch(server + '/api/v1/blacklist', {
            method: 'GET',
            headers: {
                'Authorization': header,
                'Content-Type': `application/json`
            }
        });
        const event = await update.json();

        let page = 1;
        let pageSize = 10;
        let maxPage = Math.floor(event.content.blacklist.length / pageSize) + 1;

        // form reply
        let msg = "";

        // Action row for items
        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("back")
                .setLabel('<--')
                .setStyle(ButtonStyle.Secondary)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("prev")
                .setLabel('<')
                .setStyle(ButtonStyle.Primary)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("next")
                .setLabel('>')
                .setStyle(ButtonStyle.Primary)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("max")
                .setLabel('-->')
                .setStyle(ButtonStyle.Secondary)
        );

        // Helper function

        const store = async function () {
            let lbName = `View the Nexint API blacklist.`;
            msg = "";
            for (let i = (page - 1) * pageSize; i < Math.min(pageSize + ((page - 1) * pageSize), event.content.blacklist.length); i++) {
                msg += `- <@${event.content.blacklist[i]}> (\`${event.content.blacklistName[i]}\` / ${event.content.blacklist[i]})\n`
            }
            msg += `-# Powered by https://api.nexint.org/`
            msg = await embed(lbName, msg, null, null)
        }

        await store();

        // Send the reply
        await interaction.editReply({
            embeds: [msg],
            components: [row],
            withResponse: true,
            withReply: true
        });

        // Shop function
        const shop = async function () {
            const collectorFilter = i => i.user.id === interaction.user.id;
            try {
                const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

                if (confirmation.customId == "back") {
                    page = 1;
                }
                if (confirmation.customId == "prev") {
                    page -= 1;
                    if (page < 1) {
                        page = maxPage;
                    }
                }
                if (confirmation.customId == "next") {
                    page += 1;
                    if (page > maxPage) {
                        page = 1;
                    }
                }
                if (confirmation.customId == "max") {
                    page = maxPage
                }
                await store();
                await confirmation.update({
                    embeds: [msg],
                    components: [row],
                    withResponse: true,
                    withReply: true
                })
                await shop();
                return;
            } catch (error) {

                // Interaction Collector Errors
                if (error.name == "Error [InteractionCollectorError]") {
                    // Map over the components in the action row and disable each one
                    const disabledComponents = response.resource.message.components[0].components.map(component => {
                        // Use the ButtonBuilder.from() method to create a mutable button object from the existing data
                        return ButtonBuilder.from(component.data).setDisabled(true);
                    });

                    // Create a new ActionRowBuilder with the now-disabled buttons
                    const updatedRow = new ActionRowBuilder().addComponents(disabledComponents);

                    await interaction.editReply({
                        components: [updatedRow]
                    });
                } else if (error.name != "Unknown interaction") {
					console.log(error.name);
					throw error;
				}
            }
        }

        await shop();
        await interaction.editReply(msg);
        return;
    }
};
