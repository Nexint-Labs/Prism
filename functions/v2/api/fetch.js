const { apiServer, delay, header, apiToken } = require('#config/api/NexAPI');
const { NexAPIError } = require('#functions/v2/errors/NexAPIError');

/**
 * Gets data from my Nexint API.
 * @param {String} endpoint 
 * @returns 
 */
const getAPI = async function (endpoint) {
    const activeServer = apiServer;
    if ((activeServer != null && activeServer != "")) {
        try {
            const update = await fetch(activeServer + '/api/v1' + endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const info = await update.json();
            return info
        } catch {
            console.log(`[ERROR] Could not hit the Nexint API.`);
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
    const activeServer = apiServer;
    let authData = data;
    authData.token = apiToken
    if ((activeServer != null && activeServer != "")) {
        try {
            const update = await fetch(activeServer + '/api/v1' + endpoint, {
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
            console.log(error)
            console.log("[" + Date.now() + `] [ERROR] Could not hit the Nexint API.`);
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
    postAPI,
};