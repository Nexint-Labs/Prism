const { singular, plural, symbol } = require("#config/cosmetic/ecoName")

/**
 * Adds an s if the input is plural
 * I didn't want to copy paste this an infinite amount of times lol
 * @param {Number} input 
 * @returns 
 */
const pluralValues = function(input){
    if(input == 1){
        return ""
    }
    return "s"
}

/**
 * Determines the prefix for the bot lol
 * @param {Number} input 
 * @param {Boolean} ext // optional, assumed true
 * @returns 
 */
const prefix = function(input, ext = true){
    let prefix = plural;
    if(input == 1){
        prefix = singular
    }
    if(ext){
        prefix = `${prefix} ${symbol}`
    }
    return prefix
}

module.exports = {
    pluralValues,
    prefix,
}