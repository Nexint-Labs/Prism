const { server, header, serverToken } = require('#app-config');
const { postAPI } = require('#functions/api/fetch');

/**
 * Universal wrapper for API calls between the Discord Bot and Express Backend
 */
async function apiRequest(endpoint, bodyData = {}) {
    
    const payload = {
        ...bodyData,
        token: serverToken
    };

    const response = await fetch(`${server}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': header,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    return {
        status: response.status,
        ok: response.ok,
        data: data
    };

    /*
    const realEndpoint = endpoint.replace(/^\/api\/v1(?=\/|$)/, "");

    let data = await postAPI(null, realEndpoint, bodyData)
    if (data.error === true) {
        return {
            status: "500",
            ok: false,
            data: data
        };

    }
    return {
        status: "200",
        ok: true,
        data: data
    };
    */
}

module.exports = { apiRequest };