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
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          lte(users.currentWeek, 11), // 0-11 for 12 weeks
          // Either never sent an email or last email was over a week ago
          // This is a simplified check - in production, we'd want timezone-aware scheduling
        )
      );
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

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async trackEmailOpen(emailId: number): Promise<void> {
    await db
      .update(emailHistory)
      .set({ openedAt: new Date() })
      .where(eq(emailHistory.id, emailId));
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
}

export const storage = new DatabaseStorage();
