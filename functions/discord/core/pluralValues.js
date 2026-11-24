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
 * @param {Boolean} caps // assumed true, caps or not
 * @returns 
 */
const prefix = function(input, ext = true, caps = true){
    let prefix = plural;
    if(input == 1){
        prefix = singular
    }
    if(ext){
        prefix = `${prefix} ${symbol}`
    }
    if(!caps){
        prefix = prefix.toLowerCase()
    }
    return prefix
}

module.exports = {
    pluralValues,
    prefix,
}