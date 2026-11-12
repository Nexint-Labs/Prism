const { server, delay, header, serverToken } = require('#app-config')
let date = Math.floor(Date.now() / 1000);

const getAPI = async function (serverParam, endpoint) {
    const activeServer = serverParam || server;
    if ((activeServer != null && activeServer != "")) {
        try {
            const update = await fetch(activeServer + '/api/v1' + endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': header,
                    'Content-Type': `application/json`
                }
            });
            const event = await update.json();
            date = Math.floor(Date.now() / 1000);
            return event
        } catch {
            console.log("[" + Date.now() + `] [ERROR] Could not hit the Nexint API.`);
            console.log("[" + Date.now() + `] [INFO] Relying on old data. Will get data next time.`);
            return {
                error: true,
            }
        }
    }
    return {
        error: true
    }
}

const postAPI = async function (serverParam, endpoint, data) {
    const activeServer = serverParam || server;
    let authData = data;
    authData.token = serverToken
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
            date = Math.floor(Date.now() / 1000);
            return info
        } catch {
            console.log("[" + Date.now() + `] [ERROR] Could not hit the Nexint API.`);
            console.log("[" + Date.now() + `] [INFO] Relying on old data. Will get data next time.`);
            return {
                error: true,
            }
        }
    }
    return {
        error: true
    }

}

module.exports = {
    getAPI,
    postAPI,
};