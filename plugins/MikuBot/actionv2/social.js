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

    boop: {
        description: 'Boop someone!',
        query: 'anime poke',
        targetMode: 'required',
        title: (user, target) =>
            `${user} boops ${target}! ༼ つ ◕_◕ ༽つ`,
        counter: (user, target, count) =>
            `${user} booped ${target} ${count} time${pluralValues(count)}! ༼ つ ◕_◕ ༽つ`,
        notification: (user, url) =>
            `${user} boops you! ༼ つ ◕_◕ ༽つ \n${url}`
    },
    hug: {
        description: 'Hug someone!',
        query: 'anime hug',
        targetMode: 'required',
        title: (user, target) =>
            `${user} hugs ${target}! \`(*>﹏<*)′`,
        counter: (user, target, count) =>
            `${user} hugged ${target} ${count} time${pluralValues(count)}! \`(*>﹏<*)′`,
        notification: (user, url) =>
            `${user} hugged you! \`(*>﹏<*)′ \n${url}`
    },
    cuddle: {
        description: 'Cuddle someone!',
        query: 'anime cuddle',
        targetMode: 'required',
        title: (user, target) =>
            `${user} cuddles ${target}! (づ｡◕‿‿◕｡)づ`,
        counter: (user, target, count) =>
            `${user} cuddled ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} cuddled you! ♡ \n${url}`
    },
    pat: {
        description: 'Pats someone!',
        query: 'anime pat',
        targetMode: 'required',
        title: (user, target) =>
            `${user} pats ${target}! ⸜(｡˃ ᵕ ˂ )⸝♡`,
        counter: (user, target, count) =>
            `${user} has patted ${target} ${count} time${pluralValues(count)}! ⸜(｡˃ ᵕ ˂ )⸝♡`,
        notification: (user, url) =>
            `${user} patted you! ⸜(｡˃ ᵕ ˂ )⸝♡ \n${url} `
    },
    headpat: {
        description: 'Give someone headpats!',
        query: 'anime headpat',
        targetMode: 'required',
        title: (user, target) =>
            `${user} gives ${target} headpats! (｡･ω･｡)ﾉ♡`,
        counter: (user, target, count) =>
            `${user} gave ${target} headpats ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} gave you headpats! ♡ \n${url}`
    },
    cheeks: {
        description: 'Pinch someone’s cheeks!',
        query: 'anime cheek pinch',
        targetMode: 'required',
        title: (user, target) =>
            `${user} pinches ${target}'s cheeks! (๑>◡<๑)`,
        counter: (user, target, count) =>
            `${user} pinched ${target}'s cheeks ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} pinched your cheeks! (๑>◡<๑) \n${url}`
    },
    feed: {
        description: 'Feed someone!',
        query: 'anime feeding food',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} feeds ${target}! Say aaah! (๑´ڡ\`๑)`
                : `${user} is enjoying some food!`,
        counter: (user, target, count) =>
            `${user} fed ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} fed you! (๑´ڡ\`๑) \n${url}`
    },
    handhold: {
        description: 'Hold someone’s hand!',
        query: 'anime holding hands',
        targetMode: 'required',
        title: (user, target) =>
            `${user} holds ${target}'s hand! ♡`,
        counter: (user, target, count) =>
            `${user} held ${target}'s hand ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} held your hand! ♡ \n${url}`
    },
    kiss: {
        description: 'Give someone a kiss!',
        query: 'anime kiss',
        targetMode: 'required',
        title: (user, target) =>
            `${user} kisses ${target}! ( ˘ ³˘)♥`,
        counter: (user, target, count) =>
            `${user} kissed ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} kissed you! ♡ \n${url}`
    },
    lick: {
        description: 'Lick someone!',
        query: 'anime lick',
        targetMode: 'required',
        title: (user, target) =>
            `${user} licks ${target}! Bleh! :P`,
        counter: (user, target, count) =>
            `${user} licked ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} licked you! :P \n${url}`
    },
    wave: {
        description: 'Wave to someone!',
        query: 'anime wave',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} waves to ${target}! ○( ＾皿＾)っ`
                : `${user} waves! ○( ＾皿＾)っ`,
        counter: (user, target, count) =>
            `${user} waved to ${target} ${count} time${pluralValues(count)}! ○( ＾皿＾)っ`,
        notification: (user, url) =>
            `${user} waved to you! ○( ＾皿＾)っ \n${url}`,
    },
    highfive: {
        description: 'Give someone a high five!',
        query: 'anime high five',
        targetMode: 'required',
        title: (user, target) =>
            `${user} high-fives ${target}! ✋`,
        counter: (user, target, count) =>
            `${user} high-fived ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} high-fived you! ✋ \n${url}`
    },
    handshake: {
        description: 'Shake hands with someone!',
        query: 'anime handshake',
        targetMode: 'required',
        title: (user, target) =>
            `${user} shakes hands with ${target}! 🤝`,
        counter: (user, target, count) =>
            `${user} shook hands with ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} shook hands with you! 🤝 \n${url}`
    },
    tickle: {
        description: 'Tickle someone!',
        query: 'anime tickle',
        targetMode: 'required',
        title: (user, target) =>
            `${user} tickles ${target}! (≧▽≦)`,
        counter: (user, target, count) =>
            `${user} tickled ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} tickled you! (≧▽≦) \n${url}`
    },
    bow: {
        description: 'Bow respectfully!',
        query: 'anime bow',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} bows respectfully to ${target}! (＿ ＿*)`
                : `${user} takes a respectful bow! (＿ ＿*)`,
        counter: (user, target, count) =>
            `${user} bowed to ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} bowed to you! \n${url}`
    },
    bye: {
        description: 'Say goodbye!',
        query: 'anime goodbye waving',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} says goodbye to ${target}! (｡･ω･)ﾉﾞ`
                : `${user} says goodbye, everyone! (｡･ω･)ﾉﾞ`,
        counter: (user, target, count) =>
            `${user} said goodbye to ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} said goodbye to you! \n${url}`
    },
    hi: {
        description: 'Say hello!',
        query: 'anime hello greeting',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} says hello to ${target}! ヾ(≧▽≦*)o`
                : `${user} says hello, everyone! ヾ(≧▽≦*)o`,
        counter: (user, target, count) =>
            `${user} greeted ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} said hello to you! \n${url}`
    },
    heal: {
        description: 'Heal or revive someone!',
        query: 'anime healing magic',
        targetMode: 'required',
        title: (user, target) =>
            `${user} heals ${target}! ✨💚`,
        counter: (user, target, count) =>
            `${user} healed ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} healed you! ✨ \n${url}`
    },
};

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
