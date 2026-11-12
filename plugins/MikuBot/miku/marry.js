const { SlashCommandBuilder } = require('discord.js');

// Adjust this path to your existing API client.
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { replyContainer, replyGifContainer } = require('#functions/v2/discord/replyContainer');
const { warning } = require('#config/visual/botAssets');
const { dmGifNotify } = require('#functions/v2/notify/dmNotify');
const { followUpContainer } = require('#functions/v2/discord/followUpContainer');
const { postAPI } = require('#functions/v2/api/fetch');
const { searchGif } = require('#functions/v2/api/klipy/gifs');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('marriage')
        .setDescription('Manage your marriage.')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])

        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('View a marriage status.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to check (defaults to you).')
                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub.setName('accept')
                .setDescription('Accept a marriage proposal.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user who proposed to you.')
                        .setRequired(true)
                )
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
            case 'status': {
                const target =
                    interaction.options.getUser('user') ??
                    interaction.user;

                result = await postAPI(
                    '/marriage/getStatus',
                    { userId: target.id }
                );

                if (result.error) {
                    if (interaction.options.getUser('user') === null || interaction.user.id === interaction.options.getUser('user').id) {
                        await replyContainer(
                            interaction,
                            "Marriage Error",
                            [result?.desc ??
                                "The Nexint API could not process your request."],
                            "warn",
                            warning,
                            {
                                advert: false
                            }
                        )
                        return;
                    } else {
                        await replyContainer(
                            interaction,
                            "Marriage Error",
                            [`<@${interaction.options.getUser('user').id}> is not married.`],
                            "warn",
                            warning,
                            {
                                advert: false
                            }
                        )
                        return;
                    }
                }

                const members = result.members;

                if (!Array.isArray(members) || members.length !== 2) {
                    await replyContainer(
                        interaction,
                        "Marriage Error",
                        ["Invalid marriage data returned by the API."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                const marriedAt = Math.floor(result.date / 1000);
                await replyContainer(
                    interaction,
                    "Marriage Status",
                    [`${members.map(id => `<@${id}>`).join(' and ')} ` +
                        `are married! 💍\n` +
                        `Married since <t:${marriedAt}:F>.`],
                    "default",
                )
                return;
            }

            case 'accept': {
                const proposer = interaction.options.getUser('user');

                if (proposer.bot) {
                    await replyContainer(
                        interaction,
                        "Marriage Error",
                        ["You cannot marry a bot."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                result = await postAPI(
                    '/marriage/marry',
                    {
                        acceptingUserId: userId,
                        proposingUserId: proposer.id
                    }
                );

                if (result.error) {
                    await replyContainer(
                        interaction,
                        "Marriage Error",
                        [result?.desc ??
                            "The Nexint API could not process your request."],
                        "warn",
                        warning,
                        {
                            advert: false
                        }
                    )
                    return;
                }

                const resultsGif = await searchGif(`anime wedding kiss`);

                // Handle null
                if (resultsGif == null) {
                    await replyContainer(
                        interaction,
                        "Marriage",
                        [
                            `You are now married to <@${proposer.id}>! 💍\nCongrats on your marriage!~`,
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
                    "Marriage",
                    `You are now married to <@${proposer.id}>! 💍\nCongrats on your marriage!~`,
                    resultsGif.url,
                    resultsGif.shortURL
                );

                const message =
                    `You are now married to <@${userId}>! 💍`;

                const senderMessage =
                    `You are now married to <@${proposer.id}>! 💍`;

                const results = await Promise.allSettled([
                    dmGifNotify(proposer, message, resultsGif.url, resultsGif.shortURL, false),
                    dmGifNotify(interaction.user, senderMessage, resultsGif.url, resultsGif.shortURL, false)
                ]);

                const failedUsers = [];

                for (const [index, entry] of results.entries()) {
                    if (entry.status === 'rejected' || entry.value !== 0) {
                        failedUsers.push(
                            index === 0 ? proposer.id : userId
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

                return
            }
        }
    },
};