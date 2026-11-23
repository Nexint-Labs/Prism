const { apiServer, delay, header, apiToken, apiExt } = require('#config/discord/api/NexAPI');
const { log } = require('../../core/log.mjs');
const { NexAPIError } = require('#functions/discord/errors/NexAPIError');

/**
 * Gets data from my Nexint API.
 * @param {String} endpoint 
 * @returns 
 */
const getAPI = async function (endpoint) {
    if (apiServer != null && apiServer != "") {
        try {
            const update = await fetch(apiServer + apiExt + endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const info = await update.json();
            return info
        } catch (error) {
            log.error(`Could not hit the Nexint API.`, error)
            return {
                error: true,
                desc: "Could not hit the Nexint API"
            }
        }
    }
    throw new NexAPIError("NexAPI Server is not configured.")
}

/**
 * Query data from my API.
 * Typically used with tokens...?
 * @param {String} endpoint 
 * @param {*} data 
 * @returns 
 */
const queryAPI = async function (endpoint, data) {
    let authData = data;
    authData.token = apiToken
    if (apiServer != null && apiServer != "") {
        try {
            const update = await fetch(apiServer + apiExt + endpoint, {
                method: 'QUERY',
                body: JSON.stringify(authData),
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const info = await update.json();
            return info
        } catch (error) {
            log.error(`Could not hit the Nexint API.`, error)
            console.error(error)
            return {
                error: true,
                desc: "Could not hit the Nexint API"
            }
        }
    }
    throw new NexAPIError("NexAPI Server is not configured.")

}

/**
 * Post data to my API.
 * Typically used with tokens...?
 * @param {String} endpoint 
 * @param {*} data 
 * @returns 
 */
const postAPI = async function (endpoint, data) {
    let authData = data;
    authData.token = apiToken
    if (apiServer != null && apiServer != "") {
        try {
            const update = await fetch(apiServer + apiExt + endpoint, {
                method: 'POST',
                body: JSON.stringify(authData),
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const info = await update.json();
            return info
        } catch (error) {
            log.error(`Could not hit the Nexint API.`, error)
            console.error(error)
            return {
                error: true,
                desc: "Could not hit the Nexint API"
            }
        }
    }
    throw new NexAPIError("NexAPI Server is not configured.")

}

/**
 * Delete data onm my API
 * Typically used with tokens...?
 * @param {String} endpoint 
 * @param {*} data 
 * @returns 
 */
const delAPI = async function (endpoint, data) {
    let authData = data;
    authData.token = apiToken
    if (apiServer != null && apiServer != "") {
        try {
            const update = await fetch(apiServer + apiExt + endpoint, {
                method: 'DELETE',
                body: JSON.stringify(authData),
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const info = await update.json();
            return info
        } catch (error) {
            log.error(`Could not hit the Nexint API.`, error)
            console.error(error)
            return {
                error: true,
                desc: "Could not hit the Nexint API"
            }
        }
    }
    throw new NexAPIError("NexAPI Server is not configured.")
}

module.exports = {
    getAPI,
    queryAPI,
    postAPI,
    delAPI
};