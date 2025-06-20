import { users, emailHistory, type User, type InsertUser, type EmailHistory, type InsertEmailHistory } from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";
import { users as usersTable } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUsersNeedingEmails(): Promise<User[]>;
  getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    emailsSentToday: number;
    completionRate: number;
  }>;
  logEmailHistory(emailData: InsertEmailHistory): Promise<EmailHistory>;
  getEmailHistory(userId: number): Promise<EmailHistory[]>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  trackEmailOpen(emailId: number): Promise<void>;
  trackEmailClick(emailId: number): Promise<void>;
  updateEmailStatus(emailId: number, status: 'pending' | 'sent' | 'failed'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUsersNeedingEmails(): Promise<User[]> {
    const now = new Date();
    
    // Get users who should receive emails based on their timezone
    const usersInTimeWindow = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          lte(users.currentWeek, 12), // Fixed: 1-12 weeks instead of 0-11
          // User hasn't completed the program
          gte(users.currentWeek, 0)
        )
      );

    // Filter users based on timezone and prevent duplicates
    const eligibleUsers = [];
    
    for (const user of usersInTimeWindow) {
      // Check if it's Monday 9 AM in user's timezone
      if (await this.isUserTimeWindow(user, now)) {
        // Check if user hasn't received email this week
        if (await this.shouldReceiveEmailThisWeek(user, now)) {
          eligibleUsers.push(user);
        }
      }
    }
    
    return eligibleUsers;
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    emailsSentToday: number;
    completionRate: number;
  }> {
    const totalUsersResult = await db.select().from(users);
    const activeUsersResult = await db.select().from(users).where(eq(users.isActive, true));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const emailsSentTodayResult = await db
      .select()
      .from(emailHistory)
      .where(
        and(
          gte(emailHistory.sentDate, today),
          lte(emailHistory.sentDate, tomorrow)
        )
      );

    const completedUsersResult = await db
      .select()
      .from(users)
      .where(gte(users.currentWeek, 12));

    return {
      totalUsers: totalUsersResult.length,
      activeUsers: activeUsersResult.length,
      emailsSentToday: emailsSentTodayResult.length,
      completionRate: totalUsersResult.length > 0 
        ? Math.round((completedUsersResult.length / totalUsersResult.length) * 100)
        : 0,
    };
  }

  async logEmailHistory(emailData: InsertEmailHistory): Promise<EmailHistory> {
    const [email] = await db
      .insert(emailHistory)
      .values(emailData)
      .returning();
    return email;
  }

  async getEmailHistory(userId: number): Promise<EmailHistory[]> {
    return await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.userId, userId))
      .orderBy(desc(emailHistory.sentDate));
  }

  async getUserCurrentWeek(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    
    // Ensure currentWeek is between 0-12
    const currentWeek = user.currentWeek || 0;
    return Math.max(0, Math.min(12, currentWeek));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async trackEmailOpen(emailId: number): Promise<void> {
    console.log(`Attempting to track email open for ID: ${emailId}`);
    try {
      const result = await db
        .update(emailHistory)
        .set({ openedAt: new Date() })
        .where(eq(emailHistory.id, emailId))
        .returning();
      
      if (result.length === 0) {
        console.warn(`No email record found for ID: ${emailId}`);
      } else {
        console.log(`Successfully updated email open for ID: ${emailId}`, result[0]);
      }
    } catch (error) {
      console.error(`Error tracking email open for ID ${emailId}:`, error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async trackEmailClick(emailId: number): Promise<void> {
    await db
      .update(emailHistory)
      .set({ clickCount: sql`COALESCE(${emailHistory.clickCount}, 0) + 1` })
      .where(eq(emailHistory.id, emailId));
  }

  async updateEmailStatus(emailId: number, status: 'pending' | 'sent' | 'failed'): Promise<void> {
    try {
      await db
        .update(emailHistory)
        .set({ 
          deliveryStatus: status,
          sentDate: status === 'sent' ? new Date() : undefined
        })
        .where(eq(emailHistory.id, emailId));
      
      console.log(`Email status updated to '${status}' for email ID: ${emailId}`);
    } catch (error) {
      console.error(`Failed to update email status for email ID ${emailId}:`, error);
      throw error;
    }
  }

  // Add this new method for timezone checking
  private async isUserTimeWindow(user: User, now: Date): Promise<boolean> {
    try {
      // Convert current time to user's timezone
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: user.timezone }));
      const dayOfWeek = userTime.getDay(); // 0 = Sunday, 1 = Monday
      const hour = userTime.getHours();
      
      // Check if it's Monday (1) and between 9-10 AM in user's timezone
      return dayOfWeek === 1 && hour === 9;
    } catch (error) {
      console.error(`Invalid timezone for user ${user.id}: ${user.timezone}`, error);
      // Fallback to server time if timezone is invalid
      return now.getDay() === 1 && now.getHours() === 9;
    }
  }

  // Add this method to prevent duplicate emails
  private async shouldReceiveEmailThisWeek(user: User, now: Date): Promise<boolean> {
    // Get start of current week (Monday)
    const startOfWeek = new Date(now);
    const daysSinceMonday = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    startOfWeek.setDate(now.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Check if user received email this week
    const recentEmails = await db
      .select()
      .from(emailHistory)
      .where(
        and(
          eq(emailHistory.userId, user.id),
          gte(emailHistory.sentDate, startOfWeek)
        )
      );
    
    // Also check lastEmailSent for additional safety
    const lastEmailThisWeek = user.lastEmailSent && user.lastEmailSent >= startOfWeek;
    
    return recentEmails.length === 0 && !lastEmailThisWeek;
  }
}

export const storage = new DatabaseStorage();
