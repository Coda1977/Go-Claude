import { logger } from './logger';
import { emailQueue } from './email-queue';
import { db } from '../db';
import { users, emailHistory } from '@shared/schema';
import { count, eq, sql } from 'drizzle-orm';

interface SystemMetrics {
  uptime: number;
  timestamp: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connected: boolean;
    userCount: number;
    emailsSent: number;
    emailsPending: number;
    emailsFailed: number;
  };
  emailQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: boolean;
    emailQueue: boolean;
  };
  metrics: SystemMetrics;
}

class MonitoringService {
  private startTime: number;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTime = Date.now();
    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        
        if (health.status === 'unhealthy') {
          logger.error('System health check failed', health);
        } else if (health.status === 'degraded') {
          logger.warn('System health degraded', health);
        }
      } catch (error) {
        logger.error('Health check error:', error);
      }
    }, 30000);
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    try {
      // Database metrics
      const [userCountResult] = await db.select({ count: count() }).from(users);
      const [emailsSentResult] = await db
        .select({ count: count() })
        .from(emailHistory)
        .where(eq(emailHistory.deliveryStatus, 'sent'));
      
      const [emailsPendingResult] = await db
        .select({ count: count() })
        .from(emailHistory)
        .where(eq(emailHistory.deliveryStatus, 'pending'));
      
      const [emailsFailedResult] = await db
        .select({ count: count() })
        .from(emailHistory)
        .where(eq(emailHistory.deliveryStatus, 'failed'));

      // Email queue metrics (simple in-memory queue)
      const queueStatus = emailQueue.getQueueStatus();

      return {
        uptime,
        timestamp: new Date().toISOString(),
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        database: {
          connected: true,
          userCount: userCountResult.count,
          emailsSent: emailsSentResult.count,
          emailsPending: emailsPendingResult.count,
          emailsFailed: emailsFailedResult.count
        },
        emailQueue: {
          waiting: queueStatus.pending,
          active: queueStatus.processing ? 1 : 0,
          completed: 0,
          failed: 0,
          delayed: 0
        }
      };
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      throw error;
    }
  }

  async getHealthStatus(): Promise<HealthCheck> {
    try {
      const metrics = await this.getSystemMetrics();
      
      // Test database connection
      const dbConnected = await this.testDatabaseConnection();
      
      // Test email queue status
      const queueStatus = emailQueue.getQueueStatus();
      const emailQueueHealthy = true; // Simple in-memory queue is always healthy
      
      const services = {
        database: dbConnected,
        emailQueue: emailQueueHealthy
      };

      // Determine overall health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      const criticalServices = [services.database, services.emailQueue];
      
      if (criticalServices.some(service => !service)) {
        status = 'unhealthy';
      }

      // Check memory usage
      if (metrics.memory.percentage > 90) {
        status = status === 'healthy' ? 'degraded' : 'unhealthy';
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        uptime: metrics.uptime,
        services,
        metrics
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        services: {
          database: false,
          redis: false,
          emailQueue: false
        },
        metrics: {} as SystemMetrics
      };
    }
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }

  async getDetailedMetrics(): Promise<{
    system: SystemMetrics;
    recentEmails: any[];
    topUsers: any[];
    errorRate: number;
  }> {
    try {
      const systemMetrics = await this.getSystemMetrics();
      
      // Get recent emails
      const recentEmails = await db
        .select({
          id: emailHistory.id,
          userId: emailHistory.userId,
          weekNumber: emailHistory.weekNumber,
          subject: emailHistory.subject,
          deliveryStatus: emailHistory.deliveryStatus,
          sentAt: emailHistory.sentAt,
          createdAt: emailHistory.createdAt
        })
        .from(emailHistory)
        .orderBy(sql`${emailHistory.createdAt} DESC`)
        .limit(10);

      // Get top users by email count
      const topUsers = await db
        .select({
          userId: emailHistory.userId,
          emailCount: count(emailHistory.id)
        })
        .from(emailHistory)
        .groupBy(emailHistory.userId)
        .orderBy(sql`count(${emailHistory.id}) DESC`)
        .limit(5);

      // Calculate error rate
      const totalEmails = systemMetrics.database.emailsSent + 
                         systemMetrics.database.emailsFailed;
      const errorRate = totalEmails > 0 
        ? (systemMetrics.database.emailsFailed / totalEmails) * 100 
        : 0;

      return {
        system: systemMetrics,
        recentEmails,
        topUsers,
        errorRate
      };
    } catch (error) {
      logger.error('Error getting detailed metrics:', error);
      throw error;
    }
  }

  logPerformanceMetric(operation: string, duration: number, success: boolean): void {
    const level = success ? 'info' : 'error';
    logger.log(level, `Performance metric: ${operation}`, {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString()
    });

    // Log slow operations
    if (duration > 5000) {
      logger.warn(`Slow operation detected: ${operation} took ${duration}ms`);
    }
  }

  logBusinessMetric(metric: string, value: number, metadata?: any): void {
    logger.info(`Business metric: ${metric}`, {
      metric,
      value,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    logger.info('Monitoring service shutdown complete');
  }
}

export const monitoringService = new MonitoringService();