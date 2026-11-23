const { pluralValues } = require("#functions/discord/core/pluralValues");

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

module.exports = {
    actions
}