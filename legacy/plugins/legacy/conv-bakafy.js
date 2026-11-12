/*

Archived due to MC server no longer exists.

const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { optOutIntChk } = require('#functions/optOutIntChk');
const { balanceCheck, convNameToID } = require('#functions/currency/accounts/balances');
const { bankCheck } = require('#functions/currency/accounts/banks');
const { embed, replyEmbed, replyError } = require('#functions/embed');
const { getUser } = require('#functions/shardInfo');
const { abbrevBalance } = require('#functions/abbrevValues');
const { getEcoBal, changeEcoBal } = require('#functions/ecoServer');
const { addCommandsUsed } = require('#functions/usageData');
const { devMode, devID, devMsg } = require('#app-config');
const { checkBlacklist } = require('#functions/blacklist');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('conv-bakafy')
        .setDescription('Convert funds from NexAPI (Minecraft) to TripleBaka')
        .addIntegerOption(option =>
            option
                .setName('coins')
                .setDescription('The coin amount to transfer.'))
        .addIntegerOption(option =>
            option
                .setName('zeros')
                .setDescription('The amount of zeroes behind.'))
        .addStringOption(option =>
            option
                .setName('all')
                .setDescription('Deposit all coins?')
                .addChoices(
                    { name: 'True', value: 'true' },
                )),
    async execute(interaction) {
        // defer reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) return;

        // Dev Mode
        if (interaction.user.id != devID && devMode) {
            let userEmbed = await embed("Convert", "You can't perform this action when Dev Mode is enabled.", null, null);
            await interaction.editReply({
                embeds: [userEmbed]
            });
            return;
        }

        // Get current user
        let guildMember = interaction.user;

        // opt-out check
        value = await optOutIntChk(interaction.user);
        if (value == -1) {
            return await replyEmbed(interaction, "Convert", "You are opted out. Balance commands will not work.");
        }

        // Get the balance
        const mcInfo = await getEcoBal(guildMember.id);
        let mcBal;
        let mcName;
        if (mcInfo.status === "fail") {

            // Error if the MC user doesn't exist
            return await replyError(interaction, `An error occured while trying to convert your money.\n${mcInfo.content}`);
        } else {
            mcBal = mcInfo.balance;
            mcName = mcInfo.name;
        }

        // get the balance and bank values
        let userBalance = await balanceCheck(interaction.user);
        let transfer;
        if (interaction.options.getInteger("zeros") === null) {
            transfer = interaction.options.getInteger("coins");
        } else {
            transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
        }
        if (interaction.options.getString("all") === "true") {
            transfer = mcBal;
        }
        if (transfer === null || isNaN(transfer)) {
            transfer = 0;
        }

        // check if coins is enough
        if (transfer > mcBal) {
            let userEmbed = await embed("Convert", `You have insufficient coins to perform this action.\n\n- NexAPI (Minecraft) Balance: $${mcBal}\n- TripleBaka balance: ${(await abbrevBalance(userBalance.value)).displayValue}`, null, null);
            await interaction.editReply({
                embeds: [userEmbed]
            });
            return;
        }

        // check if trying to withdraw less than 0 coins
        if (transfer <= 0) {
            let userEmbed = await embed("Convert", `Please convert a positive amount of money.`, null, null);
            await interaction.editReply({
                embeds: [userEmbed]
            });
            return;
        }

        // Confirm / deny
        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success);
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(cancel, confirm);

        // send embed
        let userEmbed = await embed("Convert", `Are you sure you want to convert $${(await abbrevBalance(transfer)).displayValue} to earn ${(await abbrevBalance(transfer * 100)).displayValue} coins?\n\n- TripleBaka balance: ${(await abbrevBalance(userBalance.value)).displayValue}\n- NexAPI (Minecraft) Balance: $${mcBal}`, null, null);
        await interaction.editReply({
            embeds: [userEmbed],
            components: [row],
            withResponse: true,
        });

        // await user interaction
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });

            // Check if confirmed or not
            if (confirmation.customId === 'confirm') {
                let waitEmbed = await embed("Convert", `Transaction processing...`, null, null);
                await confirmation.update({ embeds: [waitEmbed], components: [] });

                // RACE CONDITION PROTECTION: Re-verify live Minecraft balance immediately before deducting
                const freshMcInfo = await getEcoBal(guildMember.id);
                if (freshMcInfo.status === "fail" || freshMcInfo.balance < transfer) {
                    let failEmbed = await embed("Convert", `Transaction canceled: Your Minecraft balance changed while confirming.`, null, null);
                    await confirmation.update({ embeds: [failEmbed], components: [] });
                    return;
                }

                // Perform action// ✅ THE TRANSACTION PATCH: Pass withdrawal as a NEGATIVE delta string text parameter
                const withdrawalDelta = -transfer;
                const convMC = await changeEcoBal(guildMember.id, withdrawalDelta);
                if (convMC.status == "fail") {
                    let userEmbed = await embed("Convert", `Failed to convert money.\n${convMC.content}`, null, null);
                    await interaction.editReply({
                        embeds: [userEmbed],
                        components: [],
                    });
                    return;
                }
                userBalance.value += transfer * 100;
                await userBalance.save();
                let coinTransfer = await abbrevBalance(transfer);
                let nexTransfer = await abbrevBalance(transfer * 100);

                // Build message
                let msg = `Converted $${coinTransfer.displayValue} to ${nexTransfer.displayValue} coins.\n\nYou now have:\n- ${(await abbrevBalance(userBalance.value)).displayValue} coins\n- $${(await abbrevBalance(convMC.balance)).displayValue}`;

                // Analytics
                addCommandsUsed(interaction.user);

                // Send message + dmNotify
                userEmbed = await embed("Convert", msg, null, null);
                await confirmation.editReply({
                    embeds: [userEmbed],
                    components: [],
                    withResponse: true,
                });
            } else if (confirmation.customId === 'cancel') {

                // Cancel payment
                userEmbed = await embed("Convert", "Payment cancelled.", null, null);
                await confirmation.update({
                    embeds: [userEmbed],
                    components: [],
                });
            }
        } catch (error) {

            // Interaction Collector Errors
            if (error.name.toLowerCase().includes("[InteractionCollectorError]".toLowerCase())) {

                // Cancel item payment when confirmation not received
                userEmbed = await embed("Convert", "Confirmation not received within 30 seconds, cancelling.", null, null);
                await interaction.editReply({
                    embeds: [userEmbed],
                    components: [],
                });
            } else if (error.name != "Unknown interaction") {
                console.log(error.name);
                throw error;
            }
        }
        return;
    },
};

*/