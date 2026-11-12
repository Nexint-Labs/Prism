const { klipyKey } = require("#config/api/KlipyAPI");

// SearchGif function
// Input: search term, key
// Output: returns object, containing url and shortURL
// https://klipy.com/gifs/hatsune-miku-diddy
const searchGif = async function (search) {
    const tenorSearch = await fetch("https://api.klipy.com/v2/search?q=" + search + "&key=" + klipyKey + "&limit=" + 1 + "&contentfilter=high&random=1");
    const results = await tenorSearch.json();
    if (!results.results?.length) {
        return null;
    }
    let returns = {
        url: results.results[0].itemurl,
        shortURL: results.results[0].media_formats.gif.url
    }
    return returns
}

module.exports = {
    searchGif,
};