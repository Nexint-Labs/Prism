const { Profanease, Category } = require("profanease");
const { categorized } = require("profanease/langs/en");

const profanityFilter = new Profanease({
    languages: [categorized],
    categories: [Category.PROFANITY],
    normalize: "moderate"
});

const slurFilter = new Profanease({
    languages: [categorized],
    categories: [Category.SLUR],
    normalize: "aggressive"
});

function detectProfanity(content) {
    return profanityFilter.check(content);
}

function detectSlurs(content) {
    return slurFilter.check(content);
}

module.exports = {
    detectProfanity,
    detectSlurs
};