const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { dmNotify } = require('#functions/discord/notify/dmNotify');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { abbrevBalance } = require('#functions/discord/helpers/abbrevValues');
const { followUpNotif } = require('#functions/discord/notify/checkNotifs');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { optOutChkSingle } = require('#functions/discord/opt-out/optOut');
const { replyContainer } = require('#functions/discord/container/replyContainer');
const { warning } = require('#config/discord/visual/botAssets');
const { createAdvancedContainer, createContainer } = require('#functions/discord/container/container');
const { handleInteractionError } = require('#functions/discord/helpers/handleInteractionError');
const { postAPI, queryAPI } = require('#functions/discord/api/fetch');
const { getUsername } = require('#functions/discord/core/getUsername');
const { prefix } = require('#functions/discord/core/pluralValues');

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription(`Apply for a job to earn ${prefix(0, true, false)}`),
    async execute(interaction) {
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        let guildMember = interaction.user;
        if (await optOutChkSingle(interaction.user)) {
            await replyContainer(
                interaction,
                "Apply",
                ["You are opted out. This command will not work."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // shortened?
        let shortened = true;
        let chance = 0;
        let choices = [];
        let jobs = [];
        let choiceCount = 3;

        // Refresh Jobs Function
        const refreshJobs = async function (refresh) {
            if (refresh) {
                const request = await queryAPI("/currency/work/apply", {});
                if (request.error) {
                    await replyContainer(
                        interaction,
                        "API Error",
                        ["Could not query jobs."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return null;
                }
                const offers = request.content
                jobs = offers.jobs;
                choiceCount = offers.choiceCount;
                chance = offers.totalChance;
                choices = offers.choices.map(offer => [offer.jobId, offer.wage]);
            }

            // Build jobs
            const components = [];
            components.push({
                type: "text",
                content: `### Apply`
            })

            for (let i = 0; i < choiceCount; i++) {
                components.push({
                    type: "separator",
                    divider: true,
                    spacing: 1
                })
                components.push({
                    type: "text",
                    content: `**Job ${i + 1}: ${jobs[choices[i][0]].name}**`
                });
                if (shortened) {
                    components.push({
                        type: "text",
                        content: `| · Wage: ${(abbrevBalance(choices[i][1])).displayValue} ${prefix(choices[i][1])}\n| · Days before fired: ${(abbrevBalance(jobs[choices[i][0]].maxDays)).displayValue}\n| · Odds: ${Math.round((jobs[choices[i][0]].chance / chance) * 10000) / 100}%`
                    })
                } else {
                    components.push({
                        type: "text",
                        content: `| · Wage: ${(abbrevBalance(choices[i][1])).value} ${prefix(choices[i][1])}\n| · Days before fired: ${jobs[choices[i][0]].maxDays}\n| · Odds: ${Math.round((jobs[choices[i][0]].chance / chance) * 10000) / 100}%`
                    })
                }
            }
            let container = await createAdvancedContainer({
                color: "default",
                components: components,
                advert: false,
                copyright: true
            })
            return container;
        }
        let container = await refreshJobs(true);

        if (!container) return;

        // Action row for jobs
        const rowBuild = async function () {
            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("refresh")
                    .setLabel('🔄')
                    .setStyle(ButtonStyle.Secondary)
            );
            for (let i = 0; i < choiceCount; i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(i.toString())
                        .setLabel('Job ' + (i + 1))
                        .setStyle(ButtonStyle.Primary)
                );
            }
            if (shortened) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId("short")
                        .setLabel('Short? ✔')
                        .setStyle(ButtonStyle.Success)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId("short")
                        .setLabel('Short? ❌')
                        .setStyle(ButtonStyle.Danger)
                );
            }
            return row;
        }

        // Second row for confirm / back
        const rowBuild2 = async function (cont) {
            let row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("back2")
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Danger)
            );
            if (cont) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId("cont")
                        .setLabel('Continue')
                        .setStyle(ButtonStyle.Success)
                );
            }
            return row;
        }
        let row = await rowBuild();

        // Send the reply
        await interaction.editReply({
            components: [container, row],
            withResponse: true,
            withReply: true,
            flags: MessageFlags.IsComponentsV2
        });

        await followUpNotif(interaction);

        // Apply function

        const apply = async function () {
            const collectorFilter = i => i.user.id === interaction.user.id;
            let jobID;

            while (true) {
                try {
                    const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

                    // Toggle short
                    if (confirmation.customId == "short") {
                        shortened = !shortened;
                        row = await rowBuild();
                        container = await refreshJobs(false);
                        await confirmation.update({
                            components: [container, row],
                            withResponse: true,
                            withReply: true,
                            flags: MessageFlags.IsComponentsV2
                        });
                        jobID = undefined;
                        continue;
                    }

                    // Refresh
                    if (confirmation.customId == "refresh") {
                        container = await refreshJobs(true);

                        if (!container) return;
                        row = await rowBuild();
                        await confirmation.update({
                            components: [container, row],
                            withResponse: true,
                            withReply: true,
                            flags: MessageFlags.IsComponentsV2
                        });
                        jobID = undefined;
                        continue;
                    }

                    if (jobID === undefined) {
                        let row2 = await rowBuild2(true);
                        if (shortened) {
                            container = await createContainer(
                                "Apply",
                                [
                                    `Do you wish to apply for Job ${Number(confirmation.customId) + 1} (${jobs[choices[confirmation.customId][0]].name})?`,
                                    "**Job Stats:**",
                                    `| · Wage: ${(abbrevBalance(choices[confirmation.customId][1])).displayValue} ${prefix(choices[confirmation.customId][1])}\n| · Days Till Fired: ${jobs[choices[confirmation.customId][0]].maxDays}`
                                ]
                            );
                        } else {
                            container = await createContainer(
                                "Apply",
                                [
                                    `Do you wish to apply for Job ${Number(confirmation.customId) + 1} (${jobs[choices[confirmation.customId][0]].name})?`,
                                    "**Job Stats:**",
                                    `| · Wage: ${(abbrevBalance(choices[confirmation.customId][1])).value} ${prefix(choices[confirmation.customId][1])}\n| · Days Till Fired: ${jobs[choices[confirmation.customId][0]].maxDays}`
                                ]
                            );
                        }
                        await confirmation.update({
                            components: [container, row2],
                            withResponse: true,
                            withReply: true,
                            flags: MessageFlags.IsComponentsV2
                        });
                        jobID = Number(confirmation.customId);
                        continue;
                    }

                    // Back
                    if (confirmation.customId == "back2") {
                        row = await rowBuild();
                        container = await refreshJobs(false);
                        await confirmation.update({
                            components: [container, row],
                            withResponse: true,
                            withReply: true,
                            flags: MessageFlags.IsComponentsV2
                        });
                        jobID = undefined;
                        continue;
                    }

                    // Succeed applying
                    if (confirmation.customId !== "cont") {
                        await confirmation.deferUpdate();
                        continue;
                    }
                    let appliedJob = jobID;
                    const request = await postAPI("/currency/work/apply", {
                        name: getUsername(guildMember),
                        userId: guildMember.id,
                        jobId: choices[appliedJob][0]
                    });

                    if (request.error) {
                        await replyContainer(
                            interaction,
                            "API Error",
                            ["Could not register you for this job."],
                            "warn",
                            warning
                        )
                        return;
                    }

                    // analytics
                    await addCommandsUsed(interaction.user);

                    // Send message
                    container = await createContainer(
                        "Apply",
                        [`You are now a(n) ${jobs[choices[appliedJob][0]].name}. Your starting salary is ${request.content.wage} ${prefix(request.content.wage)}.`],
                        "default"
                    );
                    await confirmation.update({
                        components: [container],
                    });

                    // DM Notify
                    let result = await dmNotify(guildMember, [`You are now a(n) ${jobs[choices[appliedJob][0]].name}.\nYour starting salary is ${request.content.wage} ${prefix(request.content.wage)}.\nYou applied here: ${response.resource.message.url}!`]);
                    if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
                        throw result;
                    }
                    return;
                } catch (error) {
                    // Interaction Collector Errors
                    await handleInteractionError(interaction, response, error);
                    return;
                }
            }
        };

        await apply();
    },
};