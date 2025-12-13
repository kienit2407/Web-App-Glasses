import {createClient} from 'redis'
import { env } from './environment'

const client = createClient({
    url: env.REDIS_LOCAL ?? 'redis://localhost:6379',
    
    socket: {
        reconnectStrategy(retries, cause) {
            if(retries > 10) return new Error('Max retries reached')
            return Math.min(retries * 100, 2000);
        },
    }
})

export default client

export const CONNECT_REDIS = async () => {
    try {
        await client.connect()
    } catch (error) {
        console.error('Redis connection failed:', error);
        process.exit(1);
    }
}
export const CLOSE_REDIS = async () => {
    await client.close()
}