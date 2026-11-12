const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { searchGif } = require('#functions/v2/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { replyGifContainer, replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { klipyKey } = require('#config/api/KlipyAPI');
const { loadAnim } = require('#functions/v2/helpers/load');
const { optOutChk } = require('#functions/v2/opt-out/optOut');
const { postAPI } = require('#functions/v2/api/fetch');
const { pluralValues } = require('#functions/v2/core/pluralValues');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { dmGifNotify } = require('#functions/v2/notify/dmNotify');


const actions = {
    emotions: {
        description: 'Express your feelings!',
        actions: {
            angry: {
                description: 'Grr...',
                query: 'anime angry',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} is angry with ${target}... ╰（‵□′）╯`
                        : `${user} is angry... ╰（‵□′）╯`,
                counter: (user, target, count) =>
                    `${user} was angry with ${target} ${count} time${pluralValues(count)}... ╰（‵□′）╯`,
                notification: (user, url) =>
                    `${user} is angry at you... ╰（‵□′）╯ \n${url}`
            },
            blush: {
                description: 'Blush around someone!',
                query: 'anime blushing',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} blushes around ${target}! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)`
                        : `${user} is blushing! (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)`,
                counter: (user, target, count) =>
                    `${user} blushed around ${target} ${count} time${pluralValues(count)}!`,
                notification: (user, url) =>
                    `${user} blushed around you! ♡ \n${url}`
            },
            bored: {
                description: 'Feeling bored...',
                query: 'anime bored',
                targetMode: 'none',
                title: user => `${user} is bored out of their mind... (￣﹃￣)`,
            },
            confused: {
                description: 'What is happening?!',
                query: 'anime confused',
                targetMode: 'none',
                title: user => `${user} is completely confused! (・・？)`,
            },
            disgust: {
                description: 'Express your disgust!',
                query: 'anime disgusted',
                targetMode: 'none',
                title: user => `${user} is absolutely disgusted! (ಠ_ಠ)`,
            },
            drunk: {
                description: 'Feeling a little dizzy!',
                query: 'anime drunk',
                targetMode: 'none',
                title: user => `${user} is completely drunk! (＠_＠;)`,
            },
            happy: {
                description: 'Spread some happiness!',
                query: 'anime happy',
                targetMode: 'none',
                title: user => `${user} is overflowing with happiness! ヾ(≧▽≦*)o`,
            },
            lewd: {
                description: 'Thinking suspicious thoughts...',
                query: 'anime mischievous blush',
                targetMode: 'none',
                title: user => `${user} is having some suspicious thoughts... (¬‿¬)`,
            },
            psycho: {
                description: 'Unleash your inner madness!',
                query: 'anime crazy laugh',
                targetMode: 'none',
                title: user => `${user} has officially lost their marbles! (☉▽☉)`,
            },
            sad: {
                description: 'Feeling down...',
                query: 'anime sad',
                targetMode: 'none',
                title: user => `${user} is feeling sad... (｡•́︿•̀｡)`,
            },
            scared: {
                description: 'Get frightened!',
                query: 'anime scared',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} is terrified of ${target}! Σ(°△°|||)`
                        : `${user} is absolutely terrified! Σ(°△°|||)`,
                counter: (user, target, count) =>
                    `${user} was scared of ${target} ${count} time${pluralValues(count)}!`,
                notification: (user, url) =>
                    `${user} is scared of you! Σ(°△°|||) \n${url}`
            },
        }
    },

    expressions: {
        description: 'Express yourself with anime reactions!',
        actions: {
            baka: {
                description: 'BAKA!',
                query: 'anime baka tsundere',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} calls ${target} a BAKA! (╬ Ò﹏Ó)`
                        : `${user} shouts BAKA! (╬ Ò﹏Ó)`,
                counter: (user, target, count) =>
                    `${user} called ${target} a baka ${count} time${pluralValues(count)}!`,
                notification: (user, url) =>
                    `${user} called you a BAKA! (╬ Ò﹏Ó) \n${url}`
            },
            cry: {
                description: 'Let it all out... 😭',
                query: 'anime cry',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} is crying with ${target}... ಥ_ಥ`
                        : `${user} is crying... ಥ_ಥ`,
                counter: (user, target, count) =>
                    `${user} cried with ${target} ${count} time${pluralValues(count)}... ಥ_ಥ`,
                notification: (user, url) =>
                    `${user} cried with you... ಥ_ಥ \n${url}`
            },
            scream: {
                description: 'AAAAAAAAAAAA',
                query: 'anime shout',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} is screaming at ${target} (╯°□°）╯︵ ┻━┻`
                        : `${user} is screaming (╯°□°）╯︵ ┻━┻`,
                counter: (user, target, count) =>
                    `${user} screamed at ${target} ${count} time${pluralValues(count)}! (╯°□°）╯︵ ┻━┻`,
                notification: (user, url) =>
                    `${user} screamed at you... (╯°□°）╯︵ ┻━┻ \n${url}`
            },
            pout: {
                description: 'Hmph!~',
                query: 'anime tsundere',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} pouts at ${target}... Hmph! ( ˘︹˘ )`
                        : `${user} pouts... Hmph! ( ˘︹˘ )`,
                counter: (user, target, count) =>
                    `${user} pouts at ${target} ${count} time${pluralValues(count)}... ( ˘︹˘ )`,
                notification: (user, url) =>
                    `${user} pouts at you... ( ˘︹˘ ) \n${url}`
            },
            facepalm: {
                description: 'Ouch.',
                query: 'anime facepalm',
                targetMode: 'none',
                title: user => `${user} facepalmed. (⊙ˍ⊙)`,
            },
            glare: {
                description: 'Give someone a death glare!',
                query: 'anime glare',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} glares at ${target}! (ಠ益ಠ)`
                        : `${user} gives everyone a terrifying glare! (ಠ益ಠ)`,
                counter: (user, target, count) =>
                    `${user} glared at ${target} ${count} time${pluralValues(count)}!`,
                notification: (user, url) =>
                    `${user} is glaring at you! (ಠ益ಠ) \n${url}`
            },
            laugh: {
                description: 'Laugh with someone or by yourself!',
                query: 'anime laughing',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} laughs with ${target}! (≧▽≦)`
                        : `${user} bursts into laughter! (≧▽≦)`,
                counter: (user, target, count) =>
                    `${user} laughed with ${target} ${count} time${pluralValues(count)}!`,
                notification: (user, url) =>
                    `${user} laughed with you! \n${url}`
            },
            like: {
                description: 'Give your approval!',
                query: 'anime thumbs up',
                targetMode: 'none',
                title: user => `${user} approves! (๑•̀ㅂ•́)و✧`,
            },
            nope: {
                description: 'Absolutely not!',
                query: 'anime no head shake',
                targetMode: 'none',
                title: user => `${user} says NOPE! (￣ヘ￣)`,
            },
            shrug: {
                description: 'I have no idea!',
                query: 'anime shrug',
                targetMode: 'none',
                title: user => `${user} has absolutely no idea! ¯\\_(ツ)_/¯`,
            },
            smile: {
                description: 'Give everyone a smile!',
                query: 'anime smiling',
                targetMode: 'none',
                title: user => `${user} gives everyone a warm smile! (◕‿◕✿)`,
            },
            smug: {
                description: 'Look incredibly smug!',
                query: 'anime smug face',
                targetMode: 'none',
                title: user => `${user} looks unbearably smug! (￣ー￣)`,
            },
            teehee: {
                description: 'Let out a mischievous giggle!',
                query: 'anime giggle',
                targetMode: 'none',
                title: user => `${user} lets out a mischievous giggle! (๑˃̵ᴗ˂̵)`,
            },
            vomit: {
                description: 'Ewwww!',
                query: 'anime vomiting',
                targetMode: 'none',
                title: user => `${user} feels sick and throws up! (×﹏×)`,
            },
        }
    },

    miscellaneous: {
        description: 'Other reactions and expressions!',
        actions: {
            stare: {
                description: 'Stare at someone!',
                query: 'anime stare',
                targetMode: 'optional',
                title: (user, target) =>
                    target
                        ? `${user} stares intensely at ${target}... 👀`
                        : `${user} stares into the void... 👀`,
                counter: (user, target, count) =>
                    `${user} stared at ${target} ${count} time${pluralValues(count)}!`,
                notification: (user, url) =>
                    `${user} is staring at you... 👀 \n${url}`
            },
            think: {
                description: 'Start thinking...',
                query: 'anime think',
                targetMode: 'none',
                title: user => `${user} is thinking... (￣▽￣)`,
            },
            peek: {
                description: 'Take a sneaky peek!',
                query: 'anime peeking',
                targetMode: 'none',
                title: user => `${user} takes a sneaky peek... (¬‿¬)`,
            },
            wasted: {
                description: 'WASTED!',
                query: 'anime defeated exhausted',
                targetMode: 'none',
                title: user => `${user} has been absolutely WASTED! (×_×)`,
            },
        }
    }
};

const data = new SlashCommandBuilder()
    .setName('react')
    .setDescription('React to messages with anime-styled gifs!')
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

        // EXP Gain (for level system)
        if (interaction.guild && Math.random() > 0.5) {
            await expGain(interaction.user);
        }

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

                    if (result && !result.error && result.value != null) {
                        count = result.value;
                    }
                } catch (error) {
                    console.error('[Action API]', error);
                }

                description =
                    action.counter(actorName, targetName, count);
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
