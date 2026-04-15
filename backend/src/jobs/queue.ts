import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../config/redis';

const connection = { connection: redis };

// Queue definitions
export const notificationQueue = new Queue('notifications', connection);
export const reminderQueue     = new Queue('reminders',     connection);

export function createWorker(queueName: string, processor: (job: Job) => Promise<void>) {
  return new Worker(queueName, processor, connection);
}
