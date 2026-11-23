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

module.exports = {
    pluralValues
}