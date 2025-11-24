"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOSE_REDIS = exports.CONNECT_REDIS = void 0;
const redis_1 = require("redis");
const environment_1 = require("./environment");
const client = (0, redis_1.createClient)({
    url: environment_1.env.REDIS_LOCAL ?? 'redis://localhost:6379',
    socket: {
        reconnectStrategy(retries, cause) {
            if (retries > 10)
                return new Error('Max retries reached');
            return Math.min(retries * 100, 2000);
        },
    }
});
exports.default = client;
const CONNECT_REDIS = async () => {
    try {
        await client.connect();
    }
    catch (error) {
        console.error('Redis connection failed:', error);
        process.exit(1);
    }
};
exports.CONNECT_REDIS = CONNECT_REDIS;
const CLOSE_REDIS = async () => {
    await client.close();
};
exports.CLOSE_REDIS = CLOSE_REDIS;
