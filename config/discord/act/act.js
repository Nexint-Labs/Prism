const { pluralValues } = require("#functions/discord/core/pluralValues");

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

module.exports = {
    actions
}