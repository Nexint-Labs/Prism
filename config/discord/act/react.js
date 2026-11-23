const { pluralValues } = require("#functions/discord/core/pluralValues");

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

module.exports = {
    actions
}