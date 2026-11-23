// These are the valid types. Might not be a good idea to change these.
// Changing these may or may not break regression behavior.
const validTypes = new Set([
    "string",
    "number",
    "boolean",
    "undefined",
    "object",
    "function",
    "bigint",
    "symbol"
]);

module.exports = {
    validTypes
}