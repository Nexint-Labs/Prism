
const positive = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes, definitely.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Absolutely!",
    "Miku approves!",
    "39!",
    "The leek has spoken: YES.",
    "Even Teto agrees.",
    "100% yes.",
    "The stars are aligned!",
    "YES YES YES!",
    "Miku says yes! ♪"
];

const neutral = [
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Maybe.",
    "Perhaps...",
    "50/50.",
    "Miku is thinking...",
    "The leek is undecided.",
    "Error 39: Prediction unavailable.",
    "Ask Teto instead.",
    "I forgor 💀",
    "The future is buffering...",
    "Miku refuses to elaborate."
];

const negative = [
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful.",
    "Absolutely not.",
    "Nah.",
    "Nope!",
    "Miku disapproves.",
    "The leek says no.",
    "Not happening.",
    "Even Teto says no.",
    "That's a hard no.",
    "The odds are NOT in your favour.",
    "Miku has rejected your proposal.",
    "No. ♪"
];

const categories = [positive, neutral, negative];

const getAnswer = () => {
    const category = categories[
        Math.floor(Math.random() * categories.length)
    ];

    return category[
        Math.floor(Math.random() * category.length)
    ];
};

module.exports = { getAnswer };