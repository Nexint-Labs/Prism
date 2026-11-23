const { User } = require("discord.js");

/**
 * Get user (real)
 * @param {User} user 
 * @returns 
 */
const getUsername = function (user) {
    const name =
        user?.displayName
        ?? user?.globalName
        ?? user?.username
        ?? user?.id
        ?? "Unknown User";
    return name
}

module.exports = {
    getUsername
}