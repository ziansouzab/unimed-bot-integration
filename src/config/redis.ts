import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

export const conexaoRedis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null
});

export const roboQueue = new Queue('FilaRoboUnimed', {
    connection: conexaoRedis as any,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: {
            count: 30
        },
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 5000
        }
    }
});