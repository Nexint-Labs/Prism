const { User } = require('discord.js');
const { queryAPI, postAPI } = require('../api/fetch');

/**
 * Balance lol
 * @param {User} user 
 * @returns 
 */
const getUser = async function (user) {
    const result = await postAPI('/currency', {
        userId: user.id,
        name: getUsername(user)
    })
    return result
};

/**
 * Gets a leaderboard of like eerything
 * @param {Number} depth 
 * @returns 
 */
const getLeaderboard = async function (depth) {
    const result = await queryAPI('/currency', {
        depth: depth
    })
    return result
};

/**
 * Converts a name into an ID?
 * @param {String} name 
 * @returns 
 */
const convNameToID = async function (name) {
    const result = await queryAPI('/currency/convNameToID', {
        name: name
    })
    return result.content
};

module.exports = {
    getUser,
    getLeaderboard,
    convNameToID,
};