
const { defaultColor, infoColor, delMsgColor, warnColor, muteColor, kickColor, banColor, pardonColor } = require("#config/core/colors");
const { assertString } = require("#functions/v2/core/assert");
const { ColorValidationError } = require("#functions/v2/errors/ColorError");

/**
 * Set an arbitrary color
 * @param {String} StringInput 
 * @returns 
 */
const setColor = function(StringInput){
    assertString(StringInput, "Color");
    let color;
    switch(StringInput.trim().toLowerCase()){
        case "default":
            color = defaultColor;
            break;
        case "info":
            color = infoColor;
            break;
        case "delmsg":
            color = delMsgColor;
            break;
        case "warn":
            color = warnColor;
            break;
        case "mute":
            color = muteColor;
            break;
        case "kick":
            color = kickColor;
            break;
        case "ban":
            color = banColor;
            break;
        case "pardon":
            color = pardonColor;
            break;
        default:
            throw new ColorValidationError(`${StringInput} is not a valid color.`)
    }
    return color;
}

module.exports = {
    setColor
}