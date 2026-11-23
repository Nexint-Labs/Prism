const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { searchGif } = require('#functions/discord/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/discord/analytics/usageData');
const { replyGifContainer, replyContainer } = require('#functions/discord/container/replyContainer');
const { checkBlacklist } = require('#functions/discord/auth/checkBlacklist');
const { warning } = require('#config/discord/visual/botAssets');
const { klipyKey } = require('#config/discord/api/KlipyAPI');
const { loadAnim } = require('#functions/discord/helpers/load');
const { optOutChk } = require('#functions/discord/opt-out/optOut');
const { postAPI } = require('#functions/discord/api/fetch');
const { pluralValues } = require('#functions/discord/core/pluralValues');
const { expGain } = require('#functions/discord/currency/xp');
const { dmGifNotify } = require('#functions/discord/notify/dmNotify');
const { actions } = require('#config/discord/act/social');

const data = new SlashCommandBuilder()
    .setName('social')
    .setDescription('Have fun with your friends! :P')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]);

function configureSubcommand(subcommand, name, action) {
    subcommand
        .setName(name)
        .setDescription(action.description);

    if (action.targetMode && action.targetMode !== 'none') {
        subcommand.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The person to interact with.')
                .setRequired(action.targetMode === 'required')
        );

        subcommand.addBooleanOption(option =>
            option
                .setName('notify')
                .setDescription('Notify the person? Defaults to false.')
        );
    }

    return subcommand;
}

function registerActions(builder, entries, depth = 0) {
    for (const [name, entry] of Object.entries(entries)) {
        if (entry.query) {
            if (depth > 1) {
                throw new Error(
                    `Discord does not support subcommands at depth ${depth + 1}: ${name}`
                );
            }

            builder.addSubcommand(subcommand =>
                configureSubcommand(subcommand, name, entry)
            );
        } else {
            if (depth !== 0) {
                throw new Error(
                    `Nested subcommand groups are unsupported: ${name}`
                );
            }

            builder.addSubcommandGroup(group => {
                group
                    .setName(name)
                    .setDescription(entry.description || `${name} actions`);

                registerActions(group, entry.actions, depth + 1);
                return group;
            });
        }
    }

    return builder;
}

registerActions(data, actions);

module.exports = {
    cooldown: 5,
    data,

    async execute(interaction) {

        // Defer the reply
        const response = await interaction.deferReply({
            withResponse: true
        });

        // Check the blacklist
        if (await checkBlacklist(interaction)) {
            return;
        }

        if (!klipyKey) {
            await replyContainer(
                interaction,
                "Gif Config Failure",
                [
                    "The bot owner didn't set up an API key for Klipy."
                ],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // Find the specific action
        const actionName = interaction.options.getSubcommand();
        const groupName = interaction.options.getSubcommandGroup(false);

        const action = groupName
            ? actions[groupName]?.actions?.[actionName]
            : actions[actionName];

        // Action?
        if (!action) {
            await replyContainer(
                interaction,
                "Action",
                [
                    "Unknown action."
                ],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // Initial actor (person performing the command)
        const actor = interaction.user;
        const actorName = actor.displayName;

        // Target user
        const target = action.targetMode && action.targetMode !== 'none'
            ? interaction.options.getUser(
                'user',
                action.targetMode === 'required'
            )
            : null;

        await loadAnim(interaction, [
            "Finding Action Gif...",
        ], true)

        // Tracking
        addCommandsUsed(interaction.user);

        await expGain(interaction.user);

        // Search for Gif
        const results = await searchGif(action.query);

        // Handle null
        if (results == null) {
            await replyContainer(
                interaction,
                "Gif Failure",
                [
                    "Something went wrong when trying to search for a gif!"
                ],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return
        }

        // Format the title and description.
        let title = action.title(actorName, target?.displayName);
        let description = null;

        if (target) {
            const targetName = target.displayName;

            // Opt out check
            const optedOut = await optOutChk(actor, target);

            if (optedOut) {
                description = 'One of you has opted out of data collection.';
            } else {
                let count = '(API Unavailable)';

                try {
                    const result = await postAPI(
                        '/actions/updateAction',
                        {
                            userId: actor.id,
                            actionId: target.id,
                            type: actionName,
                        }
                    );

                    if (result && !result.content.error && result.content.value != null) {
                        count = result.content.value;
                    }
                } catch (error) {
                    console.error('[Action API]', error);
                }

                description = action.counter(actorName, targetName, count);
            }
        }

        // Reply with an embed.
        await replyGifContainer(
            interaction,
            title,
            description,
            results.url,
            results.shortURL
        )

        // DM notification
        if (target) {
            const notify = interaction.options.getBoolean('notify') ?? false;

            if (notify && interaction.contextType !== InteractionContextType.PrivateChannel) {
                const messageUrl = response.resource?.message?.url;

                const notification = action.notification(
                    actorName,
                    messageUrl ?? 'an interaction'
                );
                await dmGifNotify(
                    target,
                    notification,
                    results.url,
                    results.shortURL
                );
            }
        }
    },
};
