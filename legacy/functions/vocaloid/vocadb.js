
const { randomInt } = require('node:crypto');

const API = 'https://vocadb.net/api';
const POPULAR_POOL_SIZE = 500;
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();

class VocaDBError extends Error {
    constructor(message) {
        super(message);
        this.name = 'VocaDBError';
    }
}

async function request(path, params = {}, useCache = true) {
    const url = new URL(`${API}${path}`);

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
            for (const item of value) {
                url.searchParams.append(key, String(item));
            }
        } else {
            url.searchParams.set(key, String(value));
        }
    }

    const key = url.toString();
    const cached = cache.get(key);

    if (useCache && cached && cached.expires > Date.now()) {
        return cached.data;
    }

    let response;

    try {
        response = await fetch(url, {
            signal: AbortSignal.timeout(15000),
            headers: {
                Accept: 'application/json',
                'User-Agent': 'MikuBot/1.0 (https://nexint.org; VocaDB integration)',
            },
        });
    } catch (error) {
        throw new VocaDBError(
            `Could not connect to VocaDB: ${error.message}`
        );
    }

    if (!response.ok) {
        throw new VocaDBError(
            `VocaDB returned HTTP ${response.status}.`
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new VocaDBError('VocaDB returned invalid JSON.');
    }

    if (useCache) {
        if (cache.size >= 500) {
            const first = cache.keys().next().value;
            cache.delete(first);
        }

        cache.set(key, {
            data,
            expires: Date.now() + CACHE_TTL,
        });
    }

    return data;
}

const SONG_FIELDS = 'Artists,PVs,ThumbUrl';

function songParams(extra = {}) {
    return {
        fields: SONG_FIELDS,
        lang: 'English',
        ...extra,
    };
}

function normalizeSong(song) {
    if (!song) return null;

    const artists = Array.isArray(song.artists)
        ? song.artists
        : [];

    const producers = artists
        .filter(a => a?.artist?.artistType === 'Producer')
        .map(a => a.name || a.artist?.name)
        .filter(Boolean);

    const vocalists = artists
        .filter(a =>
            a?.artist?.artistType === 'Vocaloid' ||
            a?.artist?.artistType === 'UTAU' ||
            a?.artist?.artistType === 'OtherVoiceSynthesizer'
        )
        .map(a => a.name || a.artist?.name)
        .filter(Boolean);

    const pvs = Array.isArray(song.pvs) ? song.pvs : [];

    const videos = pvs
        .filter(pv =>
            typeof pv?.url === 'string' &&
            /^https?:\/\//i.test(pv.url)
        )
        .map(pv => ({
            name: pv.name || pv.service || 'Music video',
            url: pv.url,
            service: pv.service || 'Other',
            pvType: pv.pvType || null,
        }));

    const preferredVideo =
        videos.find(v =>
            v.pvType === 'Original' &&
            v.service === 'Youtube'
        ) ||
        videos.find(v => v.pvType === 'Original') ||
        videos.find(v => v.service === 'Youtube') ||
        videos[0] ||
        null;

    const thumbnail =
        song.thumbUrl ||
        song.mainPicture?.urlOriginal ||
        song.mainPicture?.urlThumb ||
        null;

    return {
        id: song.id,
        title: song.name || `Song #${song.id}`,
        type: song.songType || 'Unknown',
        producers: [...new Set(producers)],
        vocalists: [...new Set(vocalists)],
        artistString: song.artistString || 'Unknown',
        thumbnail,
        videos,
        preferredVideo,
        url: `https://vocadb.net/S/${song.id}`,
    };
}

async function searchSongs(query, limit = 10) {
    const data = await request('/songs', songParams({
        query,
        nameMatchMode: 'Auto',
        preferAccurateMatches: true,
        maxResults: Math.min(Math.max(limit, 1), 50),
    }));

    return (data.items || []).map(normalizeSong);
}

async function getRandomSong(pool = 'all') {
    if (!['all', 'popular'].includes(pool)) {
        throw new VocaDBError('Invalid random song pool.');
    }

    const sort = pool === 'popular'
        ? 'RatingScore'
        : 'Name';

    const baseParams = {
        sort,
        maxResults: 1,
        getTotalCount: true,
    };

    const countData = await request(
        '/songs',
        songParams(baseParams)
    );

    const total = Number(countData.totalCount) || 0;

    if (total < 1) return null;

    const poolSize = pool === 'popular'
        ? Math.min(total, POPULAR_POOL_SIZE)
        : total;

    // Random offset, not random among the first page.
    // Retry a few times if a result disappears between requests.
    for (let attempt = 0; attempt < 3; attempt++) {
        const offset = randomInt(poolSize);

        const data = await request('/songs', songParams({
            sort,
            start: offset,
            maxResults: 1,
        }));

        const song = data.items?.[0];

        if (song) return normalizeSong(song);
    }

    return null;
}

async function searchProducers(query, limit = 10) {
    const data = await request('/artists', {
        query,
        artistTypes: 'Producer',
        nameMatchMode: 'Auto',
        maxResults: Math.min(Math.max(limit, 1), 50),
        lang: 'English',
    });

    return (data.items || []).map(artist => ({
        id: artist.id,
        name: artist.name,
        url: `https://vocadb.net/Ar/${artist.id}`,
    }));
}

async function getSongsByProducer(producer, limit = 10) {
    const artists = await searchProducers(producer, 50);

    if (!artists.length) {
        return { producer: null, songs: [] };
    }

    const exact = artists.find(a =>
        a.name.toLowerCase() === producer.toLowerCase()
    );

    if (!exact) {
        throw new VocaDBError(
            `Could not find an exact producer match for "${producer}".`
        );
    }

    const data = await request('/songs', songParams({
        'artistId[]': exact.id,
        sort: 'RatingScore',
        maxResults: Math.min(Math.max(limit, 1), 50),
    }));

    return {
        producer: exact,
        songs: (data.items || []).map(normalizeSong),
    };
}

module.exports = {
    VocaDBError,
    searchSongs,
    getRandomSong,
    searchProducers,
    getSongsByProducer,
};
