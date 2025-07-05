import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { User } from '@shared/schema';
import { openaiService } from './openai';
import { emailService } from './email';
import { storage } from '../storage';
import { logger } from './logger';

interface WelcomeEmailJob {
  type: 'welcome';
  user: User;
  timestamp: Date;
}

interface WeeklyEmailJob {
  type: 'weekly';
  user: User;
  weekNumber: number;
  timestamp: Date;
}

type EmailJobData = WelcomeEmailJob | WeeklyEmailJob;

class RedisEmailQueue {
  private redis: Redis;
  private queue: Queue;
  private worker: Worker;
  private isShuttingDown = false;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      // Graceful connection handling
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    });

    // Initialize BullMQ queue
    this.queue = new Queue('email-queue', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 100,    // Keep last 100 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Initialize worker
    this.worker = new Worker('email-queue', this.processJob.bind(this), {
      connection: this.redis,
      concurrency: 3, // Process up to 3 jobs concurrently
      limiter: {
        max: 10,
        duration: 60000, // 10 jobs per minute to respect rate limits
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Queue events
    this.queue.on('error', (error) => {
      logger.error('Queue error:', error);
    });

    // Worker events
    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`, {
        jobId: job.id,
        type: job.data.type,
        userId: job.data.user.id,
        duration: job.processedOn! - job.processedOn!
      });
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, {
        jobId: job?.id,
        error: err.message,
        type: job?.data?.type,
        userId: job?.data?.user?.id,
        attempts: job?.attemptsMade,
        stack: err.stack
      });
    });

    this.worker.on('error', (error) => {
      logger.error('Worker error:', error);
    });

    // Redis connection events
    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  async addWelcomeEmail(user: User): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Cannot add job during shutdown');
      return;
    }

    try {
      const job = await this.queue.add('welcome-email', {
        type: 'welcome',
        user,
        timestamp: new Date()
      } as WelcomeEmailJob, {
        priority: 10, // High priority for welcome emails
        delay: 0
      });

      logger.info(`Welcome email job added for user ${user.id}`, {
        jobId: job.id,
        userId: user.id,
        userEmail: user.email
      });
    } catch (error) {
      logger.error(`Failed to add welcome email job for user ${user.id}:`, error);
      throw error;
    }
  }

  async addWeeklyEmail(user: User, weekNumber: number): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Cannot add job during shutdown');
      return;
    }

    try {
      const job = await this.queue.add('weekly-email', {
        type: 'weekly',
        user,
        weekNumber,
        timestamp: new Date()
      } as WeeklyEmailJob, {
        priority: 5, // Normal priority for weekly emails
        delay: 0
      });

      logger.info(`Weekly email job added for user ${user.id}`, {
        jobId: job.id,
        userId: user.id,
        userEmail: user.email,
        weekNumber
      });
    } catch (error) {
      logger.error(`Failed to add weekly email job for user ${user.id}:`, error);
      throw error;
    }
  }

  private async processJob(job: Job<EmailJobData>): Promise<void> {
    const { data } = job;
    
    logger.info(`Processing ${data.type} email job`, {
      jobId: job.id,
      type: data.type,
      userId: data.user.id,
      userEmail: data.user.email
    });

    try {
      if (data.type === 'welcome') {
        await this.processWelcomeEmail(data);
      } else if (data.type === 'weekly') {
        await this.processWeeklyEmail(data);
      } else {
        throw new Error(`Unknown job type: ${(data as any).type}`);
      }
    } catch (error) {
      logger.error(`Error processing ${data.type} email job:`, {
        jobId: job.id,
        error: error.message,
        stack: error.stack,
        userId: data.user.id
      });
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async processWelcomeEmail(data: WelcomeEmailJob): Promise<void> {
    try {
      // Generate AI analysis
      const goalAnalysis = await openaiService.analyzeGoals(data.user.goals);
      
      // Log email history first
      const emailRecord = await storage.logEmailHistory({
        userId: data.user.id,
        weekNumber: 1,
        subject: 'Welcome to Your Leadership Journey!',
        content: goalAnalysis.feedback,
        actionItem: goalAnalysis.goalActions.map(ga => `${ga.goal}: ${ga.action}`).join('\n'),
        deliveryStatus: 'pending'
      });

      // Send email
      const success = await emailService.sendWelcomeEmail(data.user, goalAnalysis, emailRecord.id);
      
      if (success) {
        await storage.updateEmailStatus(emailRecord.id, 'sent');
        logger.info(`Welcome email sent successfully`, {
          userId: data.user.id,
          userEmail: data.user.email,
          emailId: emailRecord.id
        });
      } else {
        await storage.updateEmailStatus(emailRecord.id, 'failed');
        throw new Error('Email service returned false');
      }
    } catch (error) {
      logger.error(`Failed to process welcome email:`, {
        userId: data.user.id,
        error: error.message
      });
      throw error;
    }
  }

  private async processWeeklyEmail(data: WeeklyEmailJob): Promise<void> {
    try {
      // Generate weekly content
      const weeklyContent = await openaiService.generateWeeklyContent(
        data.user.goals.join(', '),
        data.weekNumber,
        'previous action from week ' + (data.weekNumber - 1),
        'good'
      );

      const subject = await openaiService.generateSubjectLine(data.weekNumber, weeklyContent.actionItem);

      // Log email history first
      const emailRecord = await storage.logEmailHistory({
        userId: data.user.id,
        weekNumber: data.weekNumber,
        subject,
        content: weeklyContent.encouragement,
        actionItem: weeklyContent.actionItem,
        deliveryStatus: 'pending'
      });

      // Send email
      const success = await emailService.sendWeeklyEmail(
        data.user, 
        data.weekNumber, 
        weeklyContent, 
        subject, 
        emailRecord.id
      );
      
      if (success) {
        await storage.updateEmailStatus(emailRecord.id, 'sent');
        logger.info(`Weekly email sent successfully`, {
          userId: data.user.id,
          userEmail: data.user.email,
          weekNumber: data.weekNumber,
          emailId: emailRecord.id
        });
      } else {
        await storage.updateEmailStatus(emailRecord.id, 'failed');
        throw new Error('Email service returned false');
      }
    } catch (error) {
      logger.error(`Failed to process weekly email:`, {
        userId: data.user.id,
        weekNumber: data.weekNumber,
        error: error.message
      });
      throw error;
    }
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();
    const delayed = await this.queue.getDelayed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length
    };
  }

  async getHealthStatus(): Promise<{
    redis: boolean;
    queue: boolean;
    worker: boolean;
  }> {
    try {
      // Test Redis connection
      const redisStatus = await this.redis.ping() === 'PONG';
      
      // Test queue
      const queueStatus = !this.queue.closing;
      
      // Test worker
      const workerStatus = !this.worker.closing;

      return {
        redis: redisStatus,
        queue: queueStatus,
        worker: workerStatus
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        redis: false,
        queue: false,
        worker: false
      };
    }
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    logger.info('Shutting down email queue...');

    try {
      // Close worker first
      await this.worker.close();
      logger.info('Worker closed');

      // Close queue
      await this.queue.close();
      logger.info('Queue closed');

      // Close Redis connection
      await this.redis.quit();
      logger.info('Redis connection closed');

      logger.info('Email queue shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

export const redisEmailQueue = new RedisEmailQueue();