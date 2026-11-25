const { apiServer, delay, header, apiToken, apiExt } = require('#config/discord/api/NexAPI');
const { log } = require("#functions/core/log.mjs");
const { NexAPIError } = require('#functions/discord/errors/NexAPIError');

/**
 * Sends a request to NexAPI.
 * @param {String} endpoint
 * @param {Object} data
 * @param {String} type
 */
const requestAPI = async function (endpoint, data, type) {
    if (!apiServer) {
        throw new NexAPIError("NexAPI Server is not configured.");
    }

    try {
        const method = type.toUpperCase();

        const options = {
            method,
            headers: {
                'Authorization': header,
                'Content-Type': 'application/json'
            }
        };

        if (method !== "GET" && method !== "HEAD") {
            const authData = data;
            authData.token = apiToken;
            options.body = JSON.stringify(authData);
        }

        const update = await fetch(apiServer + apiExt + endpoint, options);
        if(method == "HEAD"){
            return update
        }
        return await update.json();
    } catch (error) {
        log.error("Could not hit the Nexint API.", error);

        return {
            error: true,
            desc: "Could not hit the Nexint API"
        };
    }
};

/**
 * Gets data from my Nexint API.
 * @param {String} endpoint 
 * @returns 
 */
const getAPI = async function (endpoint) {
    return await requestAPI(endpoint, null, "GET")
}

/**
 * Query data from my API.
 * Typically used with tokens...?
 * @param {String} endpoint 
 * @param {*} data 
 * @returns 
 */
const queryAPI = async function (endpoint, data) {
    return await requestAPI(endpoint, data, "QUERY")

}

/**
 * Post data to my API.
 * Typically used with tokens...?
 * @param {String} endpoint 
 * @param {*} data 
 * @returns 
 */
const postAPI = async function (endpoint, data) {
    return await requestAPI(endpoint, data, "POST")

}

/**
 * Delete data onm my API
 * Typically used with tokens...?
 * @param {String} endpoint 
 * @param {*} data 
 * @returns 
 */
const delAPI = async function (endpoint, data) {
    return await requestAPI(endpoint, data, "DELETE")
}

module.exports = {
    getAPI,
    queryAPI,
    postAPI,
    delAPI,
    requestAPI
};