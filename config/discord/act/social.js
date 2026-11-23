const { pluralValues } = require("#functions/discord/core/pluralValues");

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

module.exports = {
    actions
}