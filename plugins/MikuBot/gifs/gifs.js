const { SlashCommandBuilder } = require('discord.js');
const { searchGif } = require('#functions/v2/api/klipy/gifs');
const { addCommandsUsed } = require('#functions/v2/analytics/usageData');
const { expGain } = require('#functions/v2/currency/progression/xp');
const { replyGifContainer, replyContainer } = require('#functions/v2/discord/replyContainer');
const { checkBlacklist } = require('#functions/v2/auth/checkBlacklist');
const { warning } = require('#config/visual/botAssets');
const { klipyKey } = require('#config/api/KlipyAPI');
const { loadAnim } = require('#functions/v2/helpers/load');

// GIF configurations
const actions = {
    pjsk: {
        description: 'Pulls a Project Sekai GIF!',
        characters: {
            ichika: { name: 'Ichika', query: 'Hoshino Ichika project sekai' },
            saki: { name: 'Saki', query: 'Tenma Saki project sekai' },
            honami: { name: 'Honami', query: 'Mochizuki Honami project sekai' },
            shiho: { name: 'Shiho', query: 'Hinomori Shiho project sekai' },
            minori: { name: 'Minori', query: 'Hanasato Minori project sekai' },
            haruka: { name: 'Haruka', query: 'Kiritani Haruka project sekai' },
            airi: { name: 'Airi', query: 'Momoi Airi project sekai' },
            shizuku: { name: 'Shizuku', query: 'Hinomori Shizuku project sekai' },
            kohane: { name: 'Kohane', query: 'Azusawa Kohane project sekai' },
            an: { name: 'An', query: 'Shiraishi An project sekai' },
            akito: { name: 'Ak*to', query: 'Shinonome Akito project sekai' },
            toya: { name: 'Toya', query: 'Aoyagi Toya project sekai' },
            tsukasa: { name: 'Tsukasa', query: 'Tenma Tsukasa project sekai' },
            emu: { name: 'Emu', query: 'Otori Emu project sekai' },
            nene: { name: 'Nene', query: 'Kusanagi Nene project sekai' },
            rui: { name: 'Rui', query: 'Kamishiro Rui project sekai' },
            kanade: { name: 'Kanade', query: 'Yoisaki Kanade project sekai' },
            mafuyu: { name: 'Mafuyu', query: 'Asahina Mafuyu project sekai' },
            ena: { name: 'Ena', query: 'Shinonome Ena project sekai' },
            mizuki: { name: 'Mizuki', query: 'Akiyama Mizuki project sekai' },
        },
    },

    vocaloid: {
        description: 'Vocaloid, UTAU, and vocal synth GIFs!',
        characters: {
            miku: { name: 'Hatsune Miku', query: 'hatsune miku' },
            teto: { name: 'Kasane Teto', query: 'kasane teto' },
            neru: { name: 'Akita Neru', query: 'akita neru' },
            rin: { name: 'Kagamine Rin', query: 'kagamine rin' },
            len: { name: 'Kagamine Len', query: 'kagamine len' },
            luka: { name: 'Megurine Luka', query: 'megurine luka' },
            meiko: { name: 'MEIKO', query: 'meiko vocaloid' },
            kaito: { name: 'KAITO', query: 'kaito vocaloid' },
            gumi: { name: 'GUMI', query: 'gumi vocaloid' },
            ia: { name: 'IA', query: 'ia vocaloid' },
            flower: { name: 'flower (vflower)', query: 'vflower vocaloid' },
            yukari: { name: 'Yuzuki Yukari', query: 'yuzuki yukari vocaloid' },
            una: { name: 'Otomachi Una', query: 'otomachi una vocaloid' },
            kafu: { name: 'KAFU', query: 'kafu cevio' },
            sekai: { name: 'SEKAI', query: 'sekai cevio' },
            rime: { name: 'RIME', query: 'rime cevio' },
            yuki: { name: 'Kaai Yuki', query: 'kaai yuki vocaloid' },
            gakupo: { name: 'Kamui Gakupo', query: 'gakupo vocaloid' },
            fukase: { name: 'Fukase', query: 'fukase vocaloid' },
            oliver: { name: 'Oliver', query: 'oliver vocaloid' },
            seeu: { name: 'SeeU', query: 'seeu vocaloid' },
            mayu: { name: 'MAYU', query: 'mayu vocaloid' },
            lily: { name: 'Lily', query: 'lily vocaloid' },
            luo: { name: 'Luo Tianyi', query: 'luo tianyi vocaloid' },
            stardust: { name: 'Stardust (Xingchen)', query: 'xingchen vocaloid' },
            zundamon: { name: 'Zundamon', query: 'zundamon' },
            defoko: { name: 'Defoko', query: 'defoko utau' },
            momone: { name: 'Momone Momo', query: 'momone momo utau' },
            ruko: { name: 'Yokune Ruko', query: 'yokune ruko utau' },
            tei: { name: 'Sukone Tei', query: 'sukone tei utau' },
            adachi: { name: 'Adachi Rei', query: 'adachi rei' },
            eleanor: { name: 'Eleanor Forte', query: 'eleanor forte synthv' },
            solaria: { name: 'SOLARIA', query: 'solaria synthv' },
        },
    },

    touhou: {
        description: 'Pulls a Touhou Project GIF!',
        characters: {
            reimu: { name: 'Reimu Hakurei', query: 'reimu hakurei touhou' },
            marisa: { name: 'Marisa Kirisame', query: 'marisa kirisame touhou' },
            cirno: { name: 'Cirno', query: 'cirno touhou' },
            sakuya: { name: 'Sakuya Izayoi', query: 'sakuya izayoi touhou' },
            remilia: { name: 'Remilia Scarlet', query: 'remilia scarlet touhou' },
            flandre: { name: 'Flandre Scarlet', query: 'flandre scarlet touhou' },
            patchouli: { name: 'Patchouli Knowledge', query: 'patchouli knowledge touhou' },
            meiling: { name: 'Hong Meiling', query: 'hong meiling touhou' },
            youmu: { name: 'Youmu Konpaku', query: 'youmu konpaku touhou' },
            yuyuko: { name: 'Yuyuko Saigyouji', query: 'yuyuko saigyouji touhou' },
            yukari: { name: 'Yukari Yakumo', query: 'yukari yakumo touhou' },
            reisen: { name: 'Reisen Udongein Inaba', query: 'reisen touhou' },
            kaguya: { name: 'Kaguya Houraisan', query: 'kaguya houraisan touhou' },
            mokou: { name: 'Fujiwara no Mokou', query: 'mokou touhou' },
            sanae: { name: 'Sanae Kochiya', query: 'sanae kochiya touhou' },
            suwako: { name: 'Suwako Moriya', query: 'suwako moriya touhou' },
            kanako: { name: 'Kanako Yasaka', query: 'kanako yasaka touhou' },
            aya: { name: 'Aya Shameimaru', query: 'aya shameimaru touhou' },
            nitori: { name: 'Nitori Kawashiro', query: 'nitori kawashiro touhou' },
            koishi: { name: 'Koishi Komeiji', query: 'koishi komeiji touhou' },
            satori: { name: 'Satori Komeiji', query: 'satori komeiji touhou' },
            okuu: { name: 'Utsuho Reiuji', query: 'utsuho reiuji touhou' },
            tenshi: { name: 'Tenshi Hinanawi', query: 'tenshi hinanawi touhou' },
            kogasa: { name: 'Kogasa Tatara', query: 'kogasa tatara touhou' },
            byakuren: { name: 'Byakuren Hijiri', query: 'byakuren hijiri touhou' },
            junko: { name: 'Junko', query: 'junko touhou' },
            clownpiece: { name: 'Clownpiece', query: 'clownpiece touhou' },
        },
    },

    genshin: {
        description: 'Pulls a Genshin Impact GIF!',
        characters: {
            paimon: { name: 'Paimon', query: 'paimon genshin impact' },
            lumine: { name: 'Lumine', query: 'lumine genshin impact' },
            aether: { name: 'Aether', query: 'aether genshin impact' },
            amber: { name: 'Amber', query: 'amber genshin impact' },
            venti: { name: 'Venti', query: 'venti genshin impact' },
            zhongli: { name: 'Zhongli', query: 'zhongli genshin impact' },
            raiden: { name: 'Raiden Shogun', query: 'raiden shogun genshin impact' },
            nahida: { name: 'Nahida', query: 'nahida genshin impact' },
            furina: { name: 'Furina', query: 'furina genshin impact' },
            neuvillette: { name: 'Neuvillette', query: 'neuvillette genshin impact' },
            hutao: { name: 'Hu Tao', query: 'hu tao genshin impact' },
            ganyu: { name: 'Ganyu', query: 'ganyu genshin impact' },
            keqing: { name: 'Keqing', query: 'keqing genshin impact' },
            xiao: { name: 'Xiao', query: 'xiao genshin impact' },
            kazuha: { name: 'Kaedehara Kazuha', query: 'kazuha genshin impact' },
            wanderer: { name: 'Wanderer', query: 'wanderer genshin impact' },
            childe: { name: 'Tartaglia (Childe)', query: 'childe genshin impact' },
            arlecchino: { name: 'Arlecchino', query: 'arlecchino genshin impact' },
            klee: { name: 'Klee', query: 'klee genshin impact' },
            ayaka: { name: 'Kamisato Ayaka', query: 'ayaka genshin impact' },
            yoimiya: { name: 'Yoimiya', query: 'yoimiya genshin impact' },
            yaemiko: { name: 'Yae Miko', query: 'yae miko genshin impact' },
            itto: { name: 'Arataki Itto', query: 'itto genshin impact' },
            albedo: { name: 'Albedo', query: 'albedo genshin impact' },
            navia: { name: 'Navia', query: 'navia genshin impact' },
            mualani: { name: 'Mualani', query: 'mualani genshin impact' },
            kinich: { name: 'Kinich', query: 'kinich genshin impact' },
            xilonen: { name: 'Xilonen', query: 'xilonen genshin impact' },
            mavuika: { name: 'Mavuika', query: 'mavuika genshin impact' },
            citlali: { name: 'Citlali', query: 'citlali genshin impact' },
        },
    },

    hsr: {
        description: 'Pulls a Honkai: Star Rail GIF!',
        characters: {
            stelle: { name: 'Stelle', query: 'stelle honkai star rail' },
            caelus: { name: 'Caelus', query: 'caelus honkai star rail' },
            march7: { name: 'March 7th', query: 'march 7th honkai star rail' },
            danheng: { name: 'Dan Heng', query: 'dan heng honkai star rail' },
            himeko: { name: 'Himeko', query: 'himeko honkai star rail' },
            welt: { name: 'Welt', query: 'welt honkai star rail' },
            pompom: { name: 'Pom-Pom', query: 'pom pom honkai star rail' },
            kafka: { name: 'Kafka', query: 'kafka honkai star rail' },
            silverwolf: { name: 'Silver Wolf', query: 'silver wolf honkai star rail' },
            blade: { name: 'Blade', query: 'blade honkai star rail' },
            firefly: { name: 'Firefly', query: 'firefly honkai star rail' },
            sam: { name: 'SAM', query: 'sam firefly honkai star rail' },
            jingyuan: { name: 'Jing Yuan', query: 'jing yuan honkai star rail' },
            yanqing: { name: 'Yanqing', query: 'yanqing honkai star rail' },
            fuxuan: { name: 'Fu Xuan', query: 'fu xuan honkai star rail' },
            qingque: { name: 'Qingque', query: 'qingque honkai star rail' },
            bailu: { name: 'Bailu', query: 'bailu honkai star rail' },
            bronya: { name: 'Bronya', query: 'bronya honkai star rail' },
            seele: { name: 'Seele', query: 'seele honkai star rail' },
            sparkle: { name: 'Sparkle', query: 'sparkle honkai star rail' },
            blackswan: { name: 'Black Swan', query: 'black swan honkai star rail' },
            acheron: { name: 'Acheron', query: 'acheron honkai star rail' },
            aventurine: { name: 'Aventurine', query: 'aventurine honkai star rail' },
            robin: { name: 'Robin', query: 'robin honkai star rail' },
            sunday: { name: 'Sunday', query: 'sunday honkai star rail' },
            boothill: { name: 'Boothill', query: 'boothill honkai star rail' },
            ruanmei: { name: 'Ruan Mei', query: 'ruan mei honkai star rail' },
            topaz: { name: 'Topaz', query: 'topaz honkai star rail' },
            numby: { name: 'Numby', query: 'numby honkai star rail' },
            feixiao: { name: 'Feixiao', query: 'feixiao honkai star rail' },
        },
    },

    anime: {
        description: 'Pulls an anime character GIF!',
        characters: {
            marin: { name: 'Marin Kitagawa', query: 'marin kitagawa anime' },
            gojo: { name: 'Satoru Gojo', query: 'satoru gojo jujutsu kaisen' },
            yuji: { name: 'Yuji Itadori', query: 'yuji itadori jujutsu kaisen' },
            sukuna: { name: 'Ryomen Sukuna', query: 'sukuna jujutsu kaisen' },
            megumi: { name: 'Megumi Fushiguro', query: 'megumi fushiguro jujutsu kaisen' },
            nobara: { name: 'Nobara Kugisaki', query: 'nobara kugisaki jujutsu kaisen' },
            frieren: { name: 'Frieren', query: 'frieren anime' },
            fern: { name: 'Fern', query: 'fern frieren anime' },
            stark: { name: 'Stark', query: 'stark frieren anime' },
            anya: { name: 'Anya Forger', query: 'anya forger spy x family' },
            yor: { name: 'Yor Forger', query: 'yor forger spy x family' },
            loid: { name: 'Loid Forger', query: 'loid forger spy x family' },
            bocchi: { name: 'Hitori Gotoh (Bocchi)', query: 'bocchi the rock hitori' },
            nijika: { name: 'Nijika Ijichi', query: 'nijika bocchi the rock' },
            ryo: { name: 'Ryo Yamada', query: 'ryo yamada bocchi the rock' },
            kita: { name: 'Ikuyo Kita', query: 'ikuyo kita bocchi the rock' },
            hatsune: { name: 'Hatsune Miku (Anime)', query: 'hatsune miku anime gif' },
            rem: { name: 'Rem', query: 'rem re zero anime' },
            ram: { name: 'Ram', query: 'ram re zero anime' },
            emilia: { name: 'Emilia', query: 'emilia re zero anime' },
            megumin: { name: 'Megumin', query: 'megumin konosuba' },
            aqua: { name: 'Aqua', query: 'aqua konosuba' },
            darkness: { name: 'Darkness', query: 'darkness konosuba' },
            kazuma: { name: 'Kazuma', query: 'kazuma konosuba' },
            nezuko: { name: 'Nezuko Kamado', query: 'nezuko demon slayer' },
            tanjiro: { name: 'Tanjiro Kamado', query: 'tanjiro demon slayer' },
            zenitsu: { name: 'Zenitsu Agatsuma', query: 'zenitsu demon slayer' },
            shinobu: { name: 'Shinobu Kocho', query: 'shinobu demon slayer' },
            power: { name: 'Power', query: 'power chainsaw man' },
            makima: { name: 'Makima', query: 'makima chainsaw man' },
            denji: { name: 'Denji', query: 'denji chainsaw man' },
            pochita: { name: 'Pochita', query: 'pochita chainsaw man' },
        },
    },

    ddlc: {
        description: 'Pulls a Doki Doki Literature Club GIF!',
        characters: {
            monika: {
                name: 'Monika',
                query: 'monika ddlc',
            },
            sayori: {
                name: 'Sayori',
                query: 'sayori ddlc',
            },
            yuri: {
                name: 'Yuri',
                query: 'yuri ddlc',
            },
            natsuki: {
                name: 'Natsuki',
                query: 'natsuki ddlc',
            },
        },
    },

    nso: {
        description: 'Pulls a NEEDY STREAMER OVERLOAD GIF!',
        characters: {
            kangel: {
                name: 'KAngel (OMGkawaiiAngel)',
                query: 'kangel needy streamer overload',
            },
            ame: {
                name: 'Ame-chan',
                query: 'ame chan needy streamer overload',
            },
            pchan: {
                name: 'P-chan',
                query: 'p chan needy streamer overload',
            },
        },
    },

    omori: {
        description: 'Pulls an OMORI GIF!',
        characters: {
            omori: {
                name: 'Omori',
                query: 'omori game',
            },
            sunny: {
                name: 'Sunny',
                query: 'sunny omori game',
            },
            aubrey: {
                name: 'Aubrey',
                query: 'aubrey omori game',
            },
            kel: {
                name: 'Kel',
                query: 'kel omori game',
            },
            hero: {
                name: 'Hero',
                query: 'hero omori game',
            },
            basil: {
                name: 'Basil',
                query: 'basil omori game',
            },
            mari: {
                name: 'Mari',
                query: 'mari omori game',
            },
            sweetheart: {
                name: 'Sweetheart',
                query: 'sweetheart omori game',
            },
            spaceboy: {
                name: 'Captain Spaceboy',
                query: 'captain spaceboy omori',
            },
            humphrey: {
                name: 'Humphrey',
                query: 'humphrey omori game',
            },
        },
    },

    undertale: {
        description: 'Pulls an Undertale or Deltarune GIF!',
        characters: {
            frisk: {
                name: 'Frisk',
                query: 'frisk undertale',
            },
            chara: {
                name: 'Chara',
                query: 'chara undertale',
            },
            sans: {
                name: 'Sans',
                query: 'sans undertale',
            },
            papyrus: {
                name: 'Papyrus',
                query: 'papyrus undertale',
            },
            toriel: {
                name: 'Toriel',
                query: 'toriel undertale',
            },
            asgore: {
                name: 'Asgore',
                query: 'asgore undertale',
            },
            undyne: {
                name: 'Undyne',
                query: 'undyne undertale',
            },
            alphys: {
                name: 'Alphys',
                query: 'alphys undertale',
            },
            mettaton: {
                name: 'Mettaton',
                query: 'mettaton undertale',
            },
            flowey: {
                name: 'Flowey',
                query: 'flowey undertale',
            },
            asriel: {
                name: 'Asriel',
                query: 'asriel undertale',
            },
            kris: {
                name: 'Kris (Deltarune)',
                query: 'kris deltarune',
            },
            susie: {
                name: 'Susie (Deltarune)',
                query: 'susie deltarune',
            },
            ralsei: {
                name: 'Ralsei (Deltarune)',
                query: 'ralsei deltarune',
            },
            noelle: {
                name: 'Noelle (Deltarune)',
                query: 'noelle deltarune',
            },
            berdly: {
                name: 'Berdly (Deltarune)',
                query: 'berdly deltarune',
            },
            lancer: {
                name: 'Lancer (Deltarune)',
                query: 'lancer deltarune',
            },
            queen: {
                name: 'Queen (Deltarune)',
                query: 'queen deltarune',
            },
            spamton: {
                name: 'Spamton (Deltarune)',
                query: 'spamton deltarune',
            },
            jevil: {
                name: 'Jevil (Deltarune)',
                query: 'jevil deltarune',
            },
        },
    },

    bluearchive: {
        description: 'Pulls a Blue Archive GIF!',
        characters: {
            shiroko: {
                name: 'Shiroko',
                query: 'shiroko blue archive',
            },
            hoshino: {
                name: 'Hoshino',
                query: 'hoshino blue archive',
            },
            serika: {
                name: 'Serika',
                query: 'serika blue archive',
            },
            nonomi: {
                name: 'Nonomi',
                query: 'nonomi blue archive',
            },
            ayane: {
                name: 'Ayane',
                query: 'ayane blue archive',
            },
            arona: {
                name: 'Arona',
                query: 'arona blue archive',
            },
            plana: {
                name: 'Plana',
                query: 'plana blue archive',
            },
            yuuka: {
                name: 'Yuuka',
                query: 'yuuka blue archive',
            },
            noa: {
                name: 'Noa',
                query: 'noa blue archive',
            },
            aris: {
                name: 'Aris (Alice)',
                query: 'aris blue archive',
            },
            momoi: {
                name: 'Momoi',
                query: 'momoi blue archive',
            },
            midori: {
                name: 'Midori',
                query: 'midori blue archive',
            },
            yuzu: {
                name: 'Yuzu',
                query: 'yuzu blue archive',
            },
            hina: {
                name: 'Hina',
                query: 'hina blue archive',
            },
            ako: {
                name: 'Ako',
                query: 'ako blue archive',
            },
            iroha: {
                name: 'Iroha',
                query: 'iroha blue archive',
            },
            aru: {
                name: 'Aru',
                query: 'aru blue archive',
            },
            mutsuki: {
                name: 'Mutsuki',
                query: 'mutsuki blue archive',
            },
            kayoko: {
                name: 'Kayoko',
                query: 'kayoko blue archive',
            },
            haruka: {
                name: 'Haruka',
                query: 'haruka blue archive',
            },
            mika: {
                name: 'Mika',
                query: 'mika blue archive',
            },
            nagisa: {
                name: 'Nagisa',
                query: 'nagisa blue archive',
            },
            seia: {
                name: 'Seia',
                query: 'seia blue archive',
            },
            toki: {
                name: 'Toki',
                query: 'toki blue archive',
            },
            rio: {
                name: 'Rio',
                query: 'rio blue archive',
            },
        },
    },

    danganronpa: {
        description: 'Pulls a Danganronpa GIF!',
        characters: {
            makoto: {
                name: 'Makoto Naegi',
                query: 'makoto naegi danganronpa',
            },
            kyoko: {
                name: 'Kyoko Kirigiri',
                query: 'kyoko kirigiri danganronpa',
            },
            byakuya: {
                name: 'Byakuya Togami',
                query: 'byakuya togami danganronpa',
            },
            junko: {
                name: 'Junko Enoshima',
                query: 'junko enoshima danganronpa',
            },
            monokuma: {
                name: 'Monokuma',
                query: 'monokuma danganronpa',
            },
            hajime: {
                name: 'Hajime Hinata',
                query: 'hajime hinata danganronpa',
            },
            nagito: {
                name: 'Nagito Komaeda',
                query: 'nagito komaeda danganronpa',
            },
            chiaki: {
                name: 'Chiaki Nanami',
                query: 'chiaki nanami danganronpa',
            },
            ibuki: {
                name: 'Ibuki Mioda',
                query: 'ibuki mioda danganronpa',
            },
            mikan: {
                name: 'Mikan Tsumiki',
                query: 'mikan tsumiki danganronpa',
            },
            kokichi: {
                name: 'Kokichi Oma',
                query: 'kokichi oma danganronpa',
            },
            shuichi: {
                name: 'Shuichi Saihara',
                query: 'shuichi saihara danganronpa',
            },
            kaede: {
                name: 'Kaede Akamatsu',
                query: 'kaede akamatsu danganronpa',
            },
            kaito: {
                name: 'Kaito Momota',
                query: 'kaito momota danganronpa',
            },
            miu: {
                name: 'Miu Iruma',
                query: 'miu iruma danganronpa',
            },
            rantaro: {
                name: 'Rantaro Amami',
                query: 'rantaro amami danganronpa',
            },
        },
    },
};

// Register command
const data = new SlashCommandBuilder()
    .setName('gif')
    .setDescription('Pulls a character GIF!')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]);

function configureSubcommand(subcommand, name, action) {
    return subcommand
        .setName(name)
        .setDescription(action.description)
        .addStringOption(option =>
            option
                .setName('character')
                .setDescription('Which character?')
                .setRequired(true)
                .setAutocomplete(true)
        );
}

function registerActions(builder, entries) {
    for (const [name, action] of Object.entries(entries)) {
        builder.addSubcommand(subcommand =>
            configureSubcommand(subcommand, name, action)
        );
    }

    return builder;
}

registerActions(data, actions);

module.exports = {
    cooldown: 5,
    data,

    async autocomplete(interaction) {
        const actionName = interaction.options.getSubcommand();
        const action = actions[actionName];

        if (!action) {
            await interaction.respond([]);
            return;
        }

        const focused = interaction.options.getFocused().toLowerCase().trim();

        const characters = Object.entries(action.characters)
            .filter(([id, character]) =>
                id.toLowerCase().includes(focused) ||
                character.name.toLowerCase().includes(focused)
            )
            .slice(0, 25)
            .map(([id, character]) => ({
                name: character.name,
                value: id,
            }));

        await interaction.respond(characters);
    },

    async execute(interaction) {
        // Defer reply
        await interaction.deferReply({
            withResponse: true,
        });

        // Check blacklist
        if (await checkBlacklist(interaction)) {
            return;
        }

        // Check Klipy key
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

        await loadAnim(interaction, [
            "Finding Gif...",
        ], true)

        // Find the specific action
        const actionName = interaction.options.getSubcommand();
        const action = actions[actionName];

        if (!action) {
            await replyContainer(
                interaction,
                "Gif Config Failure",
                [
                    "Unknown GIF category."
                ],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // Find the character
        const characterId = interaction.options.getString('character');
        const character = action.characters[characterId];

        if (!character) {
            await replyContainer(
                interaction,
                "Gif Config Failure",
                [
                    "Unknown character."
                ],
                "warn",
                warning,
                {
                    advert: false
                }
            )
            return;
        }

        // Add to analytics
        addCommandsUsed(interaction.user);

        // Level gain (50/50)
        if (interaction.guild && Math.random() > 0.5) {
            await expGain(interaction.user);
        }

        // Search for GIF
        const results = await searchGif(character.query);

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

        // Configure GIF response
        const title = `Found a(n) ${character.name} Gif!`;

        // Send GIF
        await replyGifContainer(
            interaction,
            title,
            null,
            results.url,
            results.shortURL
        );
        return;
    },
};