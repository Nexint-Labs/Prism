
const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const {
    searchSongs,
    getRandomSong,
    searchProducers,
    getSongsByProducer,
} = require('#functions/v2/api/vocadb/vocadb');

const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { followUpNotif } = require('#functions/v2/notify/checkNotifs');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { replyContainer } = require('#functions/v2/discord/replyContainer');
const { createAdvancedContainer } = require('#functions/v2/discord/container');
const { MessageFlags } = require('discord.js');
const { warning } = require('#config/visual/botAssets');
const { simpleMenu } = require('#functions/v2/discord/menus/pageHandler');
const { loadAnim } = require('#functions/v2/helpers/load');

const data = new SlashCommandBuilder()
    .setName('song')
    .setDescription('Discover Vocaloid and vocal synth music!')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2])

    .addSubcommand(subcommand =>
        subcommand
            .setName('random')
            .setDescription('Find a random vocal synth song!')
            .addStringOption(option =>
                option
                    .setName('pool')
                    .setDescription('Choose a random song pool.')
                    .setRequired(true)
                    .addChoices(
                        { name: 'All Songs', value: 'all' },
                        { name: 'Popular Songs', value: 'popular' }
                    )
            )
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName('search')
            .setDescription('Search VocaDB for a song!')
            .addStringOption(option =>
                option
                    .setName('query')
                    .setDescription('Song title or search term.')
                    .setRequired(true)
                    .setMaxLength(150)
            )
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName('producer')
            .setDescription('Find songs by a producer!')
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('Producer name.')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    );

function safeText(value, fallback = 'Unknown') {
    if (!value) return fallback;

    return String(value)
        .replace(/@/g, '@\u200b')
        .replace(/([\\`*_~|[\]()])/g, '\\$1');
}

function formatNames(names, fallback = 'Unknown') {
    if (!names?.length) return fallback;

    const result = names.map(name => safeText(name)).join(', ');

    return result.length > 1000
        ? `${result.slice(0, 997)}...`
        : result;
}

function makeSongButtons(song) {
    const buttons = [
        new ButtonBuilder()
            .setLabel('VocaDB')
            .setStyle(ButtonStyle.Link)
            .setURL(song.url),
    ];

    if (
        song.preferredVideo &&
        song.preferredVideo.url !== song.url
    ) {
        buttons.push(
            new ButtonBuilder()
                .setLabel('Listen / Watch')
                .setStyle(ButtonStyle.Link)
                .setURL(song.preferredVideo.url)
        );
    }

    return [
        new ActionRowBuilder().addComponents(buttons),
    ];
}

async function sendSong(interaction, song, heading) {
    const components = [];
    if (song.thumbnail) {
        components.push({
            type: "section",
            title: song.title,
            description: `**${safeText(heading)}**\n-# Song information provided by VocaDB.`,
            thumbnail: { desc: song.title, url: song.thumbnail }
        })
    } else {
        components.push({
            type: "text",
            content: `### ${safeText(song.title)}\n**${safeText(heading)}**\n-# Song information provided by VocaDB.`
        })

    }
    components.push({
            type: "text",
            content:
                `**Producer(s):** ${formatNames(song.producers, safeText(song.artistString))}\n` +
                `**Vocalist(s):** ${formatNames(song.vocalists, 'Not specified')}\n` +
                `**Song Type:** ${safeText(song.type)}\n` +
                `[View on VocaDB](${song.url})`
        })
    const container = await createAdvancedContainer({
        components: components,
        advert: true,
        copyright: true
    });

    await interaction.editReply({
        components: [container, ...makeSongButtons(song)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
    });

    await followUpNotif(interaction, false);
}

async function sendSongList(interaction, response, songs, title) {
    const lines = songs.map((song, index) => (
        `**${index + 1}.** [${safeText(song.title)}](${song.url})\n` +
        `-# ${safeText(song.artistString)}`
    ));

    // The existing menu handles page buttons, styling and notifications.
    await simpleMenu(
        interaction,
        response,
        title,
        lines,
        ["No songs are available."],
        {
            compressed: true
        }
    )
}

function recordUsage(interaction) {
    addCommandsUsed(interaction.user);
    if (interaction.guild && Math.random() > 0.5) {
        void Promise.resolve(expGain(interaction.user)).catch(console.error);
    }
}

module.exports = {
    cooldown: 5,
    data,

    async autocomplete(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand !== 'producer') {
            await interaction.respond([]);
            return;
        }

        const focused = interaction.options.getFocused().trim();

        if (focused.length < 2) {
            await interaction.respond([]);
            return;
        }

        try {
            const producers = await searchProducers(focused, 25);

            await interaction.respond(
                producers.slice(0, 25).map(producer => ({
                    name: producer.name.slice(0, 100),
                    value: producer.name.slice(0, 100),
                }))
            );
        } catch (error) {
            console.error('[Song Autocomplete]', error);

            if (!interaction.responded) {
                await interaction.respond([]).catch(() => { });
            }
        }
    },

    async execute(interaction) {
        const response = await interaction.deferReply({
            withResponse: true,
        });

        if (await checkBlacklist(interaction)) {
            return;
        }
        
        await loadAnim(interaction, [
            "Loading VocaDB Info...",
        ], true)

        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'random') {
                const pool = interaction.options.getString('pool');

                const song = await getRandomSong(pool);

                if (!song) {
                    await replyContainer(
                        interaction,
                        'Song',
                        ['No songs were found in that pool.'],
                        'warn',
                        warning,
                    );
                    return;
                }

                await sendSong(
                    interaction,
                    song,
                    pool === 'popular'
                        ? 'Random Popular Song'
                        : 'Random Song'
                );
            }

            else if (subcommand === 'search') {
                const query = interaction.options.getString('query');
                const songs = await searchSongs(query, 50);

                if (!songs.length) {
                    await replyContainer(
                        interaction,
                        'Song',
                        [`No songs found for: ${safeText(query)}`],
                        'warn',
                        warning,
                    );
                    return;
                }

                // One result: detailed container.
                // Multiple results: linked search list.
                if (songs.length === 1) {
                    await sendSong(
                        interaction,
                        songs[0],
                        'Song Search Result'
                    );
                } else {
                    recordUsage(interaction);
                    await sendSongList(
                        interaction,
                        response,
                        songs,
                        `Song Search: ${query}`
                    );
                    return;
                }
            }

            else if (subcommand === 'producer') {
                const name = interaction.options.getString('name');

                const result = await getSongsByProducer(name, 50);

                if (!result.producer) {
                    await replyContainer(
                        interaction,
                        'Song',
                        [`No producer found for: ${safeText(name)}`],
                        'warn',
                        warning,
                    );
                    return;
                }

                if (!result.songs.length) {
                    await replyContainer(
                        interaction,
                        'Song',
                        [`No songs found for ${safeText(result.producer.name)}.`],
                        'warn',
                        warning,
                    );
                    return;
                }

                recordUsage(interaction);
                await sendSongList(
                    interaction,
                    response,
                    result.songs,
                    `${result.producer.name} — Popular Songs`
                );
                return;
            }

            else {
                await replyContainer(
                    interaction,
                    'Song',
                    ['Unknown song subcommand.'],
                    'warn',
                    warning,
                );
                return;
            }

            // Successful command usage.
            recordUsage(interaction);

        } catch (error) {
            console.error('[Song Command Error]', error);

            await replyContainer(
                interaction,
                'VocaDB Error',
                ['Could not retrieve song information right now. Please try again later.'],
                'warn',
                warning,
            ).catch(console.error);
        }
    },
};
