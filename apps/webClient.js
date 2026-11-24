const { frameName, frameVer, frameID, restart } = require("#config/core/core");
const { pluginName, pluginVer } = require("#config/cosmetic/config");
const { apiServer } = require("#config/discord/api/NexAPI");
const { log } = require("#functions/core/log.mjs");
const { gracefulShutdown, refreshCycle, reload } = require("#functions/core/powerCycle");
const WebSocket = require("ws");
const delay = require("#functions/core/delay")
const { spawn } = require("node:child_process");

let socket = null;
let reconnectTimer = null;
let shuttingDown = false;
let retryCount = 0;

function connect() {
    if (shuttingDown) return;

    socket = new WebSocket(apiServer);
    const ws = socket;

    ws.on("open", () => {
        retryCount = 0;
        log.event(`Connected to ${frameName} API.`);
    });

    ws.on("message", async (raw) => {
        let data;

        try {
            data = JSON.parse(raw.toString());
        } catch {
            return;
        }

        if (data.type === "getName") {
            ws.send(JSON.stringify({
                type: "name",
                value: `${frameName} v${frameVer} (${pluginName} v${pluginVer}) / Version ID: ${frameID}`
            }));
        }
        if (data.type === "restart") {
            await new Promise((resolve, reject) => {
                ws.send(JSON.stringify({
                    type: "restart",
                    value: "Restart acknowledged."
                }), error => error ? reject(error) : resolve());
            });
            await gracefulShutdown("Remote Restart", false);
            const child = spawn(restart, {
                detached: true,
                shell: true,
                stdio: 'ignore'
            })
            child.unref()
            await delay(1000)
            process.exit(0);
        }
        if (data.type === "refresh") {
            await new Promise((resolve, reject) => {
                ws.send(JSON.stringify({
                    type: "refresh",
                    value: "Refresh acknowledged."
                }), error => error ? reject(error) : resolve());
            });
            await refreshCycle("Remote Refresh")
        }
        if (data.type === "reload") {
            await new Promise((resolve, reject) => {
                ws.send(JSON.stringify({
                    type: "reload",
                    value: "Reload acknowledged."
                }), error => error ? reject(error) : resolve());
            });
            await reload("Remote Reload")
        }
        if (data.type === "getMemory") {
            const memory = process.memoryUsage();

            ws.send(JSON.stringify({
                type: "memory",
                value: {
                    pid: process.pid,
                    rss: memory.rss,
                    heapUsed: memory.heapUsed,
                    heapTotal: memory.heapTotal,
                    external: memory.external,
                    uptime: process.uptime()
                }
            }));
        }
    });

    ws.on("error", (error) => {
        if (retryCount < 3) log.warn(`WebSocket error: ${error.message}`);
    });

    ws.on("close", () => {
        if (shuttingDown || socket !== ws) return;

        if (retryCount < 3) log.warn("WebSocket disconnected. Retrying in 5 seconds...");

        if (retryCount == 3) log.warn("WebSocket disconnected.");

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, 5000);
        retryCount += 1;
    });
}

module.exports = {
    get socket() {
        return socket;
    },

    async execute() {
        shuttingDown = false;
        connect();
    },

    async refresh() {
        await this.close();
        await this.execute();
    },

    async close() {
        shuttingDown = true;

        clearTimeout(reconnectTimer);
        reconnectTimer = null;

        if (!socket) return;

        const oldSocket = socket;
        socket = null;
        oldSocket.terminate();
    }
};