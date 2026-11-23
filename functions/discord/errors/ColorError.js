class ColorValidationError extends Error {
    constructor(color, options = {}) {
        super(`${color} is not a valid color.`, options);
        this.name = "InvalidColorError";
    }
}

module.exports = {
    ColorValidationError
}