const { SlashCommandBuilder } = require('discord.js');

// Adjust this path to your existing API client.
const { confirm } = require('#functions/discord/container/menus/confirm');
const { postAPI } = require('#functions/discord/api/fetch');
const { searchGif } = require('#functions/discord/api/klipy/gifs');
const { dmGifNotify } = require('#functions/discord/notify/dmNotify');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { replyContainer, replyGifContainer } = require('#functions/discord/container/replyContainer');
const { followUpContainer } = require('#functions/discord/container/followUpContainer');
const { createContainer } = require('#functions/discord/container/container');
const { warning } = require('#config/discord/visual/botAssets');
const { apiName } = require('#config/discord/api/NexAPI');
const { log } = require('#functions/core/log.mjs');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('divorce')
        .setDescription('End your marriage.')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    async execute(interaction) {
        // defer Reply
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }

        // Add to analytics
        await addCommandsUsed(interaction.user);

        const userId = interaction.user.id;

        let result;

        // Check whether the user is married.
        const status = await postAPI(
            '/marriage/getStatus',
            { userId }
        );

        if (status.error) {
            await replyContainer(
                interaction,
                "Divorce Error",
                [status.desc ?? "Could not retrieve your marriage."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        const partnerId = status.members?.find(
            id => id !== userId
        );

        if (!partnerId) {
            await replyContainer(
                interaction,
                "Divorce Error",
                ["Could not identify your marriage partner."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        const promptContainer = await createContainer(
            "Divorce Confirmation",
            [`Are you sure you want to divorce <@${partnerId}>? This will dissolve your current marriage.`,],
            "default",
            null,
            {
                copyright: false,
                checkNotif: false,
                advert: false
            }
        );

        const { decision } = await confirm(
            interaction,
            response,
            promptContainer
        );

        if (decision === "cancel") {
            await replyContainer(
                interaction,
                "Divorce",
                ["Divorce cancelled."],
                "default",
                null,
                {
                    advert: false
                }
            )
            return;
        } else if (decision === "timeout") {
            await replyContainer(
                interaction,
                "Divorce",
                ["Confirmation not received within 30 seconds, cancelling."],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;

        }

        result = await postAPI(
            '/marriage/delMarriage',
            { userId }
        );

        if (result.error) {

            await replyContainer(
                interaction,
                "Divorce Error",
                [result?.desc ??
                    `The ${apiName} could not process your request.`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        const results = await searchGif(`anime crying`);

        // Handle null
        if (results == null) {
            await replyContainer(
                interaction,
                "Divorce",
                [
                    result?.desc ??
                    "The Nexint API could not process your request.",
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
            "Divorce",
            result?.desc ??
            "The Nexint API could not process your request.",
            results.url,
            results.shortURL
        )

        try {
            const target = await interaction.client.users.fetch(partnerId);

            const message =
                `<@${userId}> has broken up with you...`;

            const senderMessage =
                `You broke up with <@${partnerId}>...`;

            const messageResults = await Promise.allSettled([
                dmGifNotify(
                    target,
                    message,
                    results.url,
                    results.shortURL
                ),
                dmGifNotify(
                    interaction.user,
                    senderMessage,
                    results.url,
                    results.shortURL
                ),
            ]);

            const failedUsers = [];

            for (const [index, entry] of messageResults.entries()) {
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
        } catch (error) {
            log.error("Divorce notification error:", error);

            await followUpContainer(
                interaction,
                "DM Failure",
                [`I could not DM <@${partnerId}> about the breakup!`],
                "warn",
                warning,
                {
                    advert: false
                }
            )
        }
        return;
    },
};