const { klipyKey } = require('#app-config');

// SearchGif function
// Input: search term, key
// Output: returns object, containing url and shortURL
// https://klipy.com/gifs/hatsune-miku-diddy
const searchGif = async function (search) {
    const tenorSearch = await fetch("https://api.klipy.com/v2/search?q=" + search + "&key=" + klipyKey + "&limit=" + 20 + "&contentfilter=high&random=1");
    const results = await tenorSearch.json();
    let i = 0;
    let random;
    while (i == 0) {
        random = Math.floor(Math.random() * results.results.length);
        let url = results.results[random].itemurl;
        if(url != "https://klipy.com/gifs/hatsune-miku-diddy"){
            i = 1;
        };
    }
    let returns = {
        url: results.results[random].itemurl,
        shortURL: results.results[random].media_formats.gif.url
    }
    return returns
}

module.exports = {
    searchGif,
};