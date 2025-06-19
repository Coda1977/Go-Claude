import cron from "node-cron";
import { storage } from "../storage";
import { openaiService } from "./openai";
import { emailService } from "./email";

class Scheduler {
  private isProcessing = false;

  scheduleWeeklyEmails(): void {
    // Schedule for every Monday at 9:00 AM
    // In production, this would need timezone-aware scheduling
    cron.schedule("0 9 * * 1", async () => {
      console.log("Starting weekly email processing...");
      await this.processWeeklyEmails();
    });

    console.log("Weekly email scheduler initialized - runs every Monday at 9:00 AM");
  }

  async processWeeklyEmails(): Promise<{ processed: number; errors: number }> {
    if (this.isProcessing) {
      console.log("Email processing already in progress, skipping...");
      return { processed: 0, errors: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let errors = 0;

    try {
      const users = await storage.getUsersNeedingEmails();
      console.log(`Processing ${users.length} users for weekly emails`);

      for (const user of users) {
        try {
          const nextWeek = user.currentWeek + 1;
          
          // Skip if user has completed the program
          if (nextWeek > 12) {
            continue;
          }

          // Get previous email to build context
          const emailHistory = await storage.getEmailHistory(user.id);
          const previousAction = emailHistory.length > 0 ? emailHistory[0].actionItem : "Getting started with leadership development";

          // Generate weekly content with AI
          const weeklyContent = await openaiService.generateWeeklyContent(
            user.goals,
            nextWeek,
            previousAction || "Starting your leadership journey"
          );

          // Generate subject line
          const subject = await openaiService.generateSubjectLine(nextWeek, weeklyContent.actionItem);

          // Send email
          await emailService.sendWeeklyEmail(user, nextWeek, weeklyContent, subject);

          // Update user progress
          await storage.updateUser(user.id, {
            currentWeek: nextWeek,
            lastEmailSent: new Date(),
          });

          // Log email history
          await storage.logEmailHistory({
            userId: user.id,
            weekNumber: nextWeek,
            subject,
            content: `${weeklyContent.encouragement}\n\n${weeklyContent.goalConnection}`,
            actionItem: weeklyContent.actionItem,
          });

          processed++;
          console.log(`Processed week ${nextWeek} email for user ${user.id}`);

          // Add delay to avoid overwhelming the email service
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
          errors++;
        }
      }

      console.log(`Weekly email processing complete: ${processed} processed, ${errors} errors`);
    } catch (error) {
      console.error("Error in weekly email processing:", error);
      errors++;
    } finally {
      this.isProcessing = false;
    }

    return { processed, errors };
  }

  // Helper method to check if a user should receive an email based on timezone
  private shouldSendWeeklyEmail(user: any, now: Date): boolean {
    // Simplified check - in production, this would be more sophisticated
    // and would consider the user's timezone for proper Monday 9 AM scheduling
    
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return (
      user.isActive &&
      user.currentWeek < 12 &&
      (!user.lastEmailSent || new Date(user.lastEmailSent) < oneWeekAgo)
    );
  }

  // Method to get user's local time (simplified)
  private getUserLocalTime(date: Date, timezone: string): Date {
    // In production, this would use proper timezone conversion
    // For now, returning the date as-is
    return date;
  }
}

export const scheduler = new Scheduler();
