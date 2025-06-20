import { User, EmailHistory } from "@shared/schema";
import { openaiService, GoalAnalysis, WeeklyContent } from "./openai";
import { emailService } from "./email";
import { storage } from "../storage";

interface WelcomeEmailJob {
  type: 'welcome';
  user: User;
  timestamp: Date;
  retryCount: number;
}

interface WeeklyEmailJob {
  type: 'weekly';
  user: User;
  weekNumber: number;
  timestamp: Date;
  retryCount: number;
}

type EmailJob = WelcomeEmailJob | WeeklyEmailJob;

class EmailQueue {
  private queue: EmailJob[] = [];
  private processing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Process queue every 2 seconds for faster processing
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 2000);
    
    // Process immediately on startup
    setTimeout(() => this.processQueue(), 500);
  }

  addWelcomeEmail(user: User): void {
    this.queue.push({
      type: 'welcome',
      user,
      timestamp: new Date(),
      retryCount: 0
    });
    
    console.log(`[EMAIL QUEUE] Added welcome email for user ${user.id} to queue`);
    
    // Process immediately if not already processing
    if (!this.processing) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  addWeeklyEmail(user: User, weekNumber: number): void {
    this.queue.push({
      type: 'weekly',
      user,
      weekNumber,
      timestamp: new Date(),
      retryCount: 0
    });
    
    console.log(`[EMAIL QUEUE] Added weekly email (week ${weekNumber}) for user ${user.id} to queue`);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    
    try {
      const job = this.queue.shift();
      if (!job) {
        this.processing = false;
        return;
      }

      console.log(`[EMAIL QUEUE] Processing ${job.type} email for user ${job.user.id}`);
      
      const success = await this.processEmailJob(job);
      
      if (!success && job.retryCount < 3) {
        // Re-queue with incremented retry count
        job.retryCount++;
        job.timestamp = new Date(Date.now() + (job.retryCount * 60000)); // Delay by retry count minutes
        this.queue.push(job);
        console.log(`[EMAIL QUEUE] Re-queued ${job.type} email for user ${job.user.id} (retry ${job.retryCount}/3)`);
      } else if (!success) {
        console.error(`[EMAIL QUEUE] Failed to send ${job.type} email for user ${job.user.id} after 3 retries`);
      }
      
    } catch (error) {
      console.error('[EMAIL QUEUE] Error processing queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private async processEmailJob(job: EmailJob): Promise<boolean> {
    try {
      if (job.type === 'welcome') {
        return await this.processWelcomeEmail(job);
      } else if (job.type === 'weekly') {
        return await this.processWeeklyEmail(job);
      }
      return false;
    } catch (error) {
      console.error(`[EMAIL QUEUE] Error processing ${job.type} email:`, error);
      return false;
    }
  }

  private async processWelcomeEmail(job: WelcomeEmailJob): Promise<boolean> {
    try {
      // Generate AI analysis
      const goalAnalysis = await openaiService.analyzeGoals(job.user.goals);
      
      // Log email history first
      const emailRecord = await storage.logEmailHistory({
        userId: job.user.id,
        weekNumber: 1,
        subject: 'Welcome to Your Leadership Journey!',
        content: goalAnalysis.feedback,
        actionItem: goalAnalysis.goalActions.map(ga => `${ga.goal}: ${ga.action}`).join('\n'),
        deliveryStatus: 'pending'
      });

      // Send email
      const success = await emailService.sendWelcomeEmail(job.user, goalAnalysis, emailRecord.id);
      
      if (success) {
        // Update email status to 'sent' in database
        await storage.updateEmailStatus(emailRecord.id, 'sent');
        console.log(`[EMAIL QUEUE] Welcome email sent successfully to ${job.user.email}`);
        return true;
      } else {
        // Update email status to 'failed' in database
        await storage.updateEmailStatus(emailRecord.id, 'failed');
        return false;
      }
    } catch (error) {
      console.error(`[EMAIL QUEUE] Failed to process welcome email for user ${job.user.id}:`, error);
      return false;
    }
  }

  private async processWeeklyEmail(job: WeeklyEmailJob): Promise<boolean> {
    try {
      // Generate weekly content
      const weeklyContent = await openaiService.generateWeeklyContent(
        job.user.goals.join(', '),
        job.weekNumber,
        'previous action from week ' + (job.weekNumber - 1),
        'good'
      );

      const subject = await openaiService.generateSubjectLine(job.weekNumber, weeklyContent.actionItem);

      // Log email history first
      const emailRecord = await storage.logEmailHistory({
        userId: job.user.id,
        weekNumber: job.weekNumber,
        subject,
        content: weeklyContent.encouragement,
        actionItem: weeklyContent.actionItem,
        deliveryStatus: 'pending'
      });

      // Send email
      const success = await emailService.sendWeeklyEmail(job.user, job.weekNumber, weeklyContent, subject, emailRecord.id);
      
      if (success) {
        // Update email status to 'sent' in database
        await storage.updateEmailStatus(emailRecord.id, 'sent');
        console.log(`[EMAIL QUEUE] Weekly email (week ${job.weekNumber}) sent successfully to ${job.user.email}`);
        return true;
      } else {
        // Update email status to 'failed' in database
        await storage.updateEmailStatus(emailRecord.id, 'failed');
        return false;
      }
    } catch (error) {
      console.error(`[EMAIL QUEUE] Failed to process weekly email for user ${job.user.id}:`, error);
      return false;
    }
  }

  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.queue.length,
      processing: this.processing
    };
  }

  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('[EMAIL QUEUE] Shutdown complete');
  }
}

export const emailQueue = new EmailQueue();