const { SlashCommandBuilder } = require('discord.js');
const { replyContainer, replyGifContainer } = require('#functions/v2/discord/replyContainer');
const { followUpContainer } = require('#functions/v2/discord/followUpContainer');

// Adjust this path to your existing API client.
const { searchGif } = require('#functions/v2/api/klipy/gifs');
const { dmGifNotify } = require('#functions/v2/notify/dmNotify');
const { postAPI } = require('#functions/v2/api/fetch');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { simpleMenu } = require('#functions/v2/discord/menus/pageHandler');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('propose')
        .setDescription('Manage marriage proposals.')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])

        .addSubcommand(sub =>
            sub.setName('send')
                .setDescription('Propose to someone.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to propose to.')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('cancel')
                .setDescription('Cancel your outgoing proposal.')
        )

        .addSubcommand(sub =>
            sub.setName('incoming')
                .setDescription('View your incoming proposals.')
        )

        .addSubcommand(sub =>
            sub.setName('outgoing')
                .setDescription('View your outgoing proposal.')
        ),
    async execute(interaction) {
        // defer Reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        // Add to analytics
        addCommandsUsed(interaction.user);

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        let result;

        switch (subcommand) {
            case 'send': {
                const target = interaction.options.getUser('user');

                if (target.bot) {
                    await replyContainer(
                        interaction,
                        "Proposal Error",
                        ["You cannot propose to a bot."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                result = await postAPI(
                    '/propose/addProposal',
                    {
                        proposeId: userId,
                        receiveId: target.id
                    }
                );

                if (result.error) {
                    await replyContainer(
                        interaction,
                        "Proposal Error",
                        [result.desc ??
                            'The Nexint API could not process your request.'],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                if (result.married === true) {

                    const resultsGif = await searchGif(`anime wedding kiss`);

                    // Handle null
                    if (resultsGif == null) {
                        await replyContainer(
                            interaction,
                            "Proposal",
                            [
                                `You are now married to <@${target.id}>! 💍\nCongrats on your marriage!~`,
                                "Note: Gif searching has failed. Others were not notified."
                            ],
                            "warn",
                            warning,
                            {
                                advert: false
                            }
                        )
                        return
                    }

                    await replyGifContainer(
                        interaction,
                        "Proposal",
                        `You are now married to <@${target.id}>! 💍\nCongrats on your marriage!~`,
                        resultsGif.url,
                        resultsGif.shortURL
                    );
                    const message =
                        `You are now married to <@${userId}>! 💍`;

                    const senderMessage =
                        `You are now married to <@${target.id}>! 💍`;

                    const results = await Promise.allSettled([
                        dmGifNotify(target, message, resultsGif.url, resultsGif.shortURL, false),
                        dmGifNotify(interaction.user, senderMessage, resultsGif.url, resultsGif.shortURL, false)
                    ]);

                    const failedUsers = [];

                    for (const [index, entry] of results.entries()) {
                        if (entry.status === 'rejected' || entry.value !== 0) {
                            failedUsers.push(
                                index === 0 ? target.id : userId
                            );
                        }
                    }

                    if (failedUsers.length > 0) {
                        await followUpContainer(
                            interaction,
                            "DM Failure",
                            [`I could not DM ${failedUsers.map(id => `<@${id}>`).join(' and ')} about the marriage!`],
                            "warn",
                            warning,
                            {
                                advert: false
                            }
                        )
                    }
                } else {

                    const results = await searchGif(`anime love confession`);

                    // Handle null
                    if (results == null) {
                        await replyContainer(
                            interaction,
                            "Divorce",
                            [
                                `You proposed to <@${target.id}>.\n` +
                                `Expires <t:${Math.floor(Date.now() / 1000) + 86_400}:R>.`,
                                "Note: Gif searching has failed. Others were not notified."
                            ],
                            "warn",
                            warning,
                            {
                                advert: false
                            }
                        )
                        return
                    }

                    await replyGifContainer(
                        interaction,
                        "Proposal",
                        `You proposed to <@${target.id}>.\n` +
                        `Expires <t:${Math.floor(Date.now() / 1000) + 86_400}:R>.`,
                        results.url,
                        results.shortURL
                    );
                    // Ordinary proposal.
                    const message =
                        `<@${userId}> has proposed to you! 💍\n` +
                        `Use \`/marriage accept\` to accept their proposal.`;

                    const dmResult = await dmGifNotify(
                        target,
                        message,
                        results.url,
                        results.shortURL
                    );

                    if (dmResult !== 0) {
                        await followUpContainer(
                            interaction,
                            "DM Failure",
                            [`I could not DM <@${target.id}> about the marriage!`],
                            "warn",
                            warning,
                            {
                                advert: false
                            }
                        )
                    }
                }

                return;
            }

            case 'cancel':
                result = await postAPI(
                    '/propose/delProposal',
                    { userId }
                );

                await replyContainer(
                    interaction,
                    result.error ? "Proposal Error" : "Proposal",
                    [result.desc ?? "Could not process your request."],
                    result.error ? "warn" : "default",
                    result.error ? warning : null,
                    { advert: false }
                );
                return;

            case 'incoming': {
                result = await postAPI(
                    '/propose/getIncoming',
                    { userId }
                );

                if (result.error) {
                    await replyContainer(
                        interaction,
                        "Proposal Error",
                        [result.desc ??
                            'The Nexint API could not process your request.'],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                const proposals = result.proposals ?? [];

                if (!proposals.length) {
                    await replyContainer(
                        interaction,
                        "Proposal Error",
                        ["You have no active incoming proposals."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                const proposalArray = proposals.map(p => {
                    const expiresAt = p.expiresAt;

                    return (
                        `• <@${p.proposeId}> — expires ` +
                        `<t:${Math.floor(expiresAt / 1000)}:R>`
                    );
                });

                await simpleMenu(
                    interaction,
                    response,
                    "Incoming Proposals",
                    proposalArray,
                    ["You have no active incoming proposals."],
                    {
                        compressed: true,
                    }
                )

                return;
            }

            case 'outgoing': {
                result = await postAPI(
                    '/propose/getOutgoing',
                    { userId }
                );

                if (result.error) {
                    await replyContainer(
                        interaction,
                        "Proposal Error",
                        [result.desc ??
                            'The Nexint API could not process your request.'],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                await replyContainer(
                    interaction,
                    "Proposal",
                    [`You proposed to <@${result.receiveId}>.\n` +
                        `Expires <t:${Math.floor(result.expiresAt / 1000)}:R>.`],
                    "default"
                )
                return;
            }
        }
    },
};