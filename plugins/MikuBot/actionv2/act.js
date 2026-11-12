
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
    boom: {
        description: 'Explosion! - Megumin',
        query: 'megumin explosion',
        targetMode: 'none',
        title: () => 'BOOM! 💥💥💥',
    },
    eat: {
        description: 'Nom. Eat the world.',
        query: 'anime food',
        targetMode: 'none',
        title: user => `${user} ate EVERYTHING ╰(*°▽°*)╯`,
    },
    fly: {
        description: 'Fly to the Skies!',
        query: 'anime bird sky',
        targetMode: 'none',
        title: user => `${user} flew to the skies! ヾ(＠⌒ー⌒＠)ノ`,
    },
    dance: {
        description: 'Dance alone or with someone!',
        query: 'anime dancing',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} dances with ${target}! ♪(๑ᴖ◡ᴖ๑)♪`
                : `${user} starts dancing! ♪(๑ᴖ◡ᴖ๑)♪`,
        counter: (user, target, count) =>
            `${user} danced with ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} danced with you! ♪ \n${url}`
    },
    cheer: {
        description: 'Cheer someone on!',
        query: 'anime cheering',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} cheers for ${target}! ヽ(>∀<☆)ノ`
                : `${user} is cheering! ヽ(>∀<☆)ノ`,
        counter: (user, target, count) =>
            `${user} cheered for ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} cheered for you! 🎉 \n${url}`
    },
    banghead: {
        description: 'Bang your head against something!',
        query: 'anime head desk',
        targetMode: 'none',
        title: user => `${user} bangs their head against the desk! (╯°□°)╯`,
    },
    claps: {
        description: 'Give someone a round of applause!',
        query: 'anime clapping applause',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} applauds ${target}! ヽ(≧▽≦)ﾉ👏`
                : `${user} starts clapping! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`,
        counter: (user, target, count) =>
            `${user} applauded ${target} ${count} time${pluralValues(count)}! 👏`,
        notification: (user, url) =>
            `${user} applauded you! 👏 \n${url}`
    },
    cook: {
        description: 'Cook something delicious!',
        query: 'anime cooking food',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} cooks a delicious meal for ${target}! (๑˃ᴗ˂)ﻭ🍳`
                : `${user} is cooking up something delicious! (๑˃ᴗ˂)ﻭ🍳`,
        counter: (user, target, count) =>
            `${user} cooked for ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} cooked you a delicious meal! 🍳 \n${url}`
    },
    dab: {
        description: 'Hit the dab!',
        query: 'anime dab pose',
        targetMode: 'none',
        title: user => `${user} hits the DAB! (⌐■_■)ノ`,
    },
    jump: {
        description: 'Jump for joy!',
        query: 'anime jumping',
        targetMode: 'none',
        title: user => `${user} jumps into the air! ヽ(>∀<☆)ノ`,
    },
    play: {
        description: 'Play alone or with someone!',
        query: 'anime playing games',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} plays with ${target}! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`
                : `${user} is having fun playing! (≧▽≦)`,
        counter: (user, target, count) =>
            `${user} played with ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} played with you! 🎮 \n${url}`
    },
    run: {
        description: 'Run as fast as you can!',
        query: 'anime running',
        targetMode: 'none',
        title: user => `${user} runs for their life! ᕕ( ᐛ )ᕗ`,
    },
    sing: {
        description: 'Sing your heart out!',
        query: 'anime singing microphone',
        targetMode: 'none',
        title: user => `${user} sings their heart out! ♪ヽ(^^ヽ)♪`,
    },
    sip: {
        description: 'Take a little sip!',
        query: 'anime drinking tea',
        targetMode: 'none',
        title: user => `${user} takes a peaceful sip... (￣▽￣)旦`,
    },
    sleep: {
        description: 'Get some well-deserved rest!',
        query: 'anime sleeping',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} falls asleep beside ${target}! (－ω－) zzZ`
                : `${user} falls fast asleep... (－ω－) zzZ`,
        counter: (user, target, count) =>
            `${user} slept beside ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} fell asleep beside you! 💤 \n${url}`
    },
    wag: {
        description: 'Wag your imaginary tail!',
        query: 'anime girl wagging tail',
        targetMode: 'none',
        title: user => `${user} happily wags their tail! U・ᴥ・U ♡`,
    },
    fail: {
        description: 'Fail spectacularly!',
        query: 'anime epic fail',
        targetMode: 'none',
        title: user => `${user} failed spectacularly! (╥﹏╥)`,
    },
};

const data = new SlashCommandBuilder()
    .setName('act')
    .setDescription('Express yourself with anime reactions!')
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
