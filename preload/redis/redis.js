const { createClient } = require('redis');
const { redisToken } = require('#config/api/RedisAPI');

// 1. Build URI safely using template literals or URL encoding if credentials contain special characters
const redisUrl = `rediss://default:${encodeURIComponent(redisToken)}@alert-jennet-81049.upstash.io:6379`;

// 2. Configure client with retry logic and socket timeouts
const upstashPublisher = createClient({
    url: redisUrl,
    socket: {
        tls: true,
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
            // Exponential backoff: retry up to 3 seconds max interval
            const delay = Math.min(retries * 50, 3000);
            return delay;
        }
    }
});

// 3. Register global event handlers before connecting
upstashPublisher.on('connect', () => {
    console.log('[Upstash] Socket connected.');
});

upstashPublisher.on('ready', () => {
    console.log('[Upstash] Ready for Real-Time Team Chat Pub/Sub.');
});

upstashPublisher.on('error', (err) => {
    console.error('[Upstash] Redis Client Error:', err.message);
});

upstashPublisher.on('reconnecting', () => {
    console.warn('[Upstash] Reconnecting to Redis...');
});

// 4. Wrap connection initialization gracefully
const connectRedis = async () => {
    if (!upstashPublisher.isOpen) {
        try {
            await upstashPublisher.connect();
        } catch (err) {
            console.error('[Upstash] Failed initial connection:', err);
        }
    }
};

module.exports = {
    upstashPublisher,
    connectRedis,
    async execute() { // Re-sync API

        // Start connection process immediately
        await connectRedis();
    }
}
