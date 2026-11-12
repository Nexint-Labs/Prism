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
    poke: {
        description: 'Pokes someone!',
        query: 'anime poke',
        targetMode: 'required',
        title: (user, target) =>
            `${user} pokes ${target}! ༼ つ ◕_◕ ༽つ`,
        counter: (user, target, count) =>
            `${user} poked ${target} ${count} time${pluralValues(count)}! ༼ つ ◕_◕ ༽つ`,
        notification: (user, url) =>
            `${user} pokes you! ༼ つ ◕_◕ ༽つ \n${url}`
    },
    kill: {
        description: 'Kill command - not serious',
        query: 'anime murder kill',
        targetMode: 'optional',
        title: (user, target) =>
            target
                ? `${user} killed ${target}...`
                : `${user} died...`,
        counter: (user, target, count) =>
            `${user} killed ${target} ${count} time${pluralValues(count)}...`,
        notification: (user, url) =>
            `${user} killed you... ${url}`
    },
    punch: {
        description: 'Punches someone!',
        query: 'anime punch',
        targetMode: 'required',
        title: (user, target) =>
            `${user} punches ${target} D:`,
        counter: (user, target, count) =>
            `${user} has punched ${target} ${count} time${pluralValues(count)} D:`,
        notification: (user, url) =>
            `${user} punches you D: \n${url} `
    },
    slap: {
        description: 'Slap someone!',
        query: 'anime slap',
        targetMode: 'required',
        title: (user, target) =>
            `${user} slapped ${target}!`,
        counter: (user, target, count) =>
            `${user} slapped ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} slapped you! ${url}`
    },
    bite: {
        description: 'Bite someone!',
        query: 'anime bite',
        targetMode: 'required',
        title: (user, target) =>
            `${user} bites ${target}! (ง •̀_•́)ง`,
        counter: (user, target, count) =>
            `${user} has bitten ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} bit you! (ง •̀_•́)ง \n${url}`
    },
    bonk: {
        description: 'BONK someone!',
        query: 'anime bonk',
        targetMode: 'required',
        title: (user, target) =>
            `${user} bonks ${target}! (ノಠ益ಠ)ノ`,
        counter: (user, target, count) =>
            `${user} bonked ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} bonked you! \n${url}`
    },
    chase: {
        description: 'Chase someone!',
        query: 'anime chasing running',
        targetMode: 'required',
        title: (user, target) =>
            `${user} is chasing ${target}! 🏃`,
        counter: (user, target, count) =>
            `${user} chased ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} is chasing you! RUN! 🏃 \n${url}`
    },
    yeet: {
        description: 'YEET someone into orbit!',
        query: 'anime throwing person',
        targetMode: 'required',
        title: (user, target) =>
            `${user} YEETS ${target} into orbit! 🚀`,
        counter: (user, target, count) =>
            `${user} yeeted ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} YEETED YOU INTO ORBIT! 🚀 \n${url}`
    },
    bang: {
        description: 'Cartoon-style shoot someone!',
        query: 'anime finger gun bang',
        targetMode: 'required',
        title: (user, target) =>
            `${user} goes BANG at ${target}! 🔫`,
        counter: (user, target, count) =>
            `${user} shot ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} went BANG at you! 💥 \n${url}`
    },
    kick: {
        description: 'Kick someone!',
        query: 'anime kick',
        targetMode: 'required',
        title: (user, target) =>
            `${user} kicks ${target}! (ง'̀-'́)ง`,
        counter: (user, target, count) =>
            `${user} kicked ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} kicked you! \n${url}`
    },
    knockout: {
        description: 'Knock someone out!',
        query: 'anime knockout punch',
        targetMode: 'required',
        title: (user, target) =>
            `${user} knocks ${target} OUT! 💫`,
        counter: (user, target, count) =>
            `${user} knocked out ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} knocked you out! 💫 \n${url}`
    },
    smack: {
        description: 'Smack someone on the head!',
        query: 'anime head smack',
        targetMode: 'required',
        title: (user, target) =>
            `${user} smacks ${target} on the head! 💢`,
        counter: (user, target, count) =>
            `${user} smacked ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} smacked you on the head! \n${url}`
    },
    spank: {
        description: 'Give someone a playful spank!',
        query: 'anime comedy slap',
        targetMode: 'required',
        title: (user, target) =>
            `${user} spanks ${target}! (￣▽￣)`,
        counter: (user, target, count) =>
            `${user} spanked ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} spanked you! \n${url}`
    },
    splash: {
        description: 'Splash someone with water!',
        query: 'anime water splash',
        targetMode: 'required',
        title: (user, target) =>
            `${user} splashes ${target}! 💦`,
        counter: (user, target, count) =>
            `${user} splashed ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} splashed you! 💦 \n${url}`
    },
    spray: {
        description: 'Spray someone with water!',
        query: 'anime water spray',
        targetMode: 'required',
        title: (user, target) =>
            `${user} sprays ${target}! 💦`,
        counter: (user, target, count) =>
            `${user} sprayed ${target} ${count} time${pluralValues(count)}!`,
        notification: (user, url) =>
            `${user} sprayed you! 💦 \n${url}`
    },
};

const data = new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Commit social atrocities with anime-styled gifs!')
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
