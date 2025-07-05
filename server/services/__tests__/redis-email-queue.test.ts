import { User } from '@shared/schema';

// Mock dependencies
jest.mock('bullmq');
jest.mock('ioredis');
jest.mock('../openai');
jest.mock('../email');
jest.mock('../logger');

import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

describe('RedisEmailQueue', () => {
  let mockRedis: jest.Mocked<Redis>;
  let mockQueue: jest.Mocked<Queue>;
  let mockWorker: jest.Mocked<Worker>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    goals: ['Leadership', 'Communication'],
    timezone: 'UTC',
    currentWeek: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis
    mockRedis = {
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    } as any;

    // Mock Queue
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      getWaiting: jest.fn().mockResolvedValue([]),
      getActive: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      getDelayed: jest.fn().mockResolvedValue([]),
      closing: false
    } as any;

    // Mock Worker
    mockWorker = {
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      closing: false
    } as any;

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);
    (Queue as jest.MockedClass<typeof Queue>).mockImplementation(() => mockQueue);
    (Worker as jest.MockedClass<typeof Worker>).mockImplementation(() => mockWorker);
  });

  describe('addWelcomeEmail', () => {
    it('should add welcome email job to queue', async () => {
      // Import after mocking
      const { redisEmailQueue } = await import('../redis-email-queue');
      
      await redisEmailQueue.addWelcomeEmail(mockUser);

      expect(mockQueue.add).toHaveBeenCalledWith('welcome-email', 
        expect.objectContaining({
          type: 'welcome',
          user: mockUser,
          timestamp: expect.any(Date)
        }),
        expect.objectContaining({
          priority: 10,
          delay: 0
        })
      );
    });

    it('should not add jobs during shutdown', async () => {
      const { redisEmailQueue } = await import('../redis-email-queue');
      
      // Simulate shutdown
      (redisEmailQueue as any).isShuttingDown = true;
      
      await redisEmailQueue.addWelcomeEmail(mockUser);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('addWeeklyEmail', () => {
    it('should add weekly email job to queue', async () => {
      const { redisEmailQueue } = await import('../redis-email-queue');
      
      await redisEmailQueue.addWeeklyEmail(mockUser, 2);

      expect(mockQueue.add).toHaveBeenCalledWith('weekly-email', 
        expect.objectContaining({
          type: 'weekly',
          user: mockUser,
          weekNumber: 2,
          timestamp: expect.any(Date)
        }),
        expect.objectContaining({
          priority: 5,
          delay: 0
        })
      );
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', async () => {
      const { redisEmailQueue } = await import('../redis-email-queue');
      
      const status = await redisEmailQueue.getQueueStatus();

      expect(status).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      });
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', async () => {
      const { redisEmailQueue } = await import('../redis-email-queue');
      
      const health = await redisEmailQueue.getHealthStatus();

      expect(health).toEqual({
        redis: true,
        queue: true,
        worker: true
      });
    });

    it('should return false when Redis is down', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));
      
      const { redisEmailQueue } = await import('../redis-email-queue');
      
      const health = await redisEmailQueue.getHealthStatus();

      expect(health).toEqual({
        redis: false,
        queue: false,
        worker: false
      });
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const { redisEmailQueue } = await import('../redis-email-queue');
      
      await redisEmailQueue.shutdown();

      expect(mockWorker.close).toHaveBeenCalled();
      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});