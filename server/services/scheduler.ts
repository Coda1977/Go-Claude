
import cron from "node-cron";
import { storage } from "../storage";
import { openaiService } from "./openai";
import { emailService } from "./email";

class Scheduler {
  private isProcessing = false;
  private emailQueue: Array<{ user: any; retryCount: number }> = [];

  scheduleWeeklyEmails(): void {
    // Run every hour to check for users in their timezone window
    cron.schedule("0 * * * *", async () => {
      console.log("Checking for users needing weekly emails...");
      await this.processWeeklyEmails();
    });

    // Retry failed emails every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
      await this.retryFailedEmails();
    });

    console.log("Weekly email scheduler initialized - checks hourly for timezone-appropriate sends");
  }

  async processWeeklyEmails(): Promise<{ processed: number; errors: number; queued: number }> {
    if (this.isProcessing) {
      console.log("Email processing already in progress, skipping...");
      return { processed: 0, errors: 0, queued: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let errors = 0;
    let queued = 0;

    try {
      const users = await storage.getUsersNeedingEmails();
      console.log(`Found ${users.length} users eligible for weekly emails`);

      for (const user of users) {
        try {
          const nextWeek = (user.currentWeek || 0) + 1;
          
          // Skip if user has completed the program
          if (nextWeek > 12) {
            console.log(`User ${user.id} has completed the 12-week program`);
            continue;
          }

          // Validate user has goals (required for AI generation)
          if (!user.goals || user.goals.trim().length === 0) {
            console.error(`User ${user.id} has no goals set, skipping email`);
            continue;
          }

          await this.sendWeeklyEmailToUser(user, nextWeek);
          processed++;

          // Add delay to avoid overwhelming email service
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
          
          // Add to retry queue instead of failing completely
          this.emailQueue.push({ user, retryCount: 0 });
          queued++;
        }
      }

      console.log(`Weekly email processing complete: ${processed} processed, ${errors} errors, ${queued} queued for retry`);
    } catch (error) {
      console.error("Error in weekly email processing:", error);
      errors++;
    } finally {
      this.isProcessing = false;
    }

    return { processed, errors, queued };
  }

  private async sendWeeklyEmailToUser(user: any, weekNumber: number): Promise<void> {
    try {
      // Get previous email to build context
      const emailHistory = await storage.getEmailHistory(user.id);
      const previousAction = emailHistory.length > 0 
        ? emailHistory[0].actionItem 
        : "Starting your leadership journey";

      // Calculate engagement level based on email analytics
      const engagementLevel = this.calculateEngagementLevel(emailHistory);

      // Generate weekly content with AI
      const weeklyContent = await openaiService.generateWeeklyContent(
        user.goals,
        weekNumber,
        previousAction,
        engagementLevel
      );

      // Generate subject line
      const subject = await openaiService.generateSubjectLine(weekNumber, weeklyContent.actionItem);

      // Log email history first to get tracking ID
      const emailRecord = await storage.logEmailHistory({
        userId: user.id,
        weekNumber: weekNumber,
        subject,
        content: `${weeklyContent.encouragement}\n\n${weeklyContent.goalConnection}`,
        actionItem: weeklyContent.actionItem,
      });

      // Send email with tracking ID
      await emailService.sendWeeklyEmail(user, weekNumber, weeklyContent, subject, emailRecord.id);

      // Update user progress
      await storage.updateUser(user.id, {
        currentWeek: weekNumber,
        lastEmailSent: new Date(),
      });

      console.log(`Successfully sent week ${weekNumber} email to user ${user.id} (${user.email})`);

    } catch (error) {
      console.error(`Failed to send email to user ${user.id}:`, error);
      throw error; // Re-throw to be caught by caller
    }
  }

  private calculateEngagementLevel(emailHistory: any[]): string {
    if (emailHistory.length === 0) return "new_user";
    
    // Look at last 3 emails for engagement pattern
    const recentEmails = emailHistory.slice(0, 3);
    const totalEmails = recentEmails.length;
    
    if (totalEmails === 0) return "new_user";
    
    const openedEmails = recentEmails.filter(email => email.openedAt).length;
    const totalClicks = recentEmails.reduce((sum, email) => sum + (email.clickCount || 0), 0);
    
    const openRate = openedEmails / totalEmails;
    const avgClicksPerEmail = totalClicks / totalEmails;
    
    if (openRate >= 0.8 && avgClicksPerEmail >= 0.5) return "highly_engaged";
    if (openRate >= 0.6) return "engaged";
    if (openRate >= 0.3) return "moderately_engaged";
    return "low_engagement";
  }

  private async retryFailedEmails(): Promise<void> {
    if (this.emailQueue.length === 0) return;

    console.log(`Retrying ${this.emailQueue.length} failed emails...`);
    
    const emailsToRetry = [...this.emailQueue];
    this.emailQueue = [];

    for (const { user, retryCount } of emailsToRetry) {
      try {
        if (retryCount >= 3) {
          console.error(`Max retries reached for user ${user.id}, giving up`);
          continue;
        }

        const nextWeek = (user.currentWeek || 0) + 1;
        
        if (nextWeek <= 12) {
          await this.sendWeeklyEmailToUser(user, nextWeek);
          console.log(`Retry successful for user ${user.id}`);
        }

      } catch (error) {
        console.error(`Retry failed for user ${user.id} (attempt ${retryCount + 1}):`, error);
        // Add back to queue with incremented retry count
        this.emailQueue.push({ user, retryCount: retryCount + 1 });
      }
    }
  }

  // Manual trigger method for admin
  async triggerWeeklyEmailsNow(): Promise<{ processed: number; errors: number; queued: number }> {
    console.log("Manually triggering weekly email processing...");
    return await this.processWeeklyEmails();
  }
}

export const scheduler = new Scheduler();
