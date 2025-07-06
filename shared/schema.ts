import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  timezone: text("timezone").notNull(),
  goals: text("goals").array().notNull(),
  
  // Leadership Context Fields
  currentRole: text("current_role").notNull(), // IC, Manager, Director, VP, C-Level
  teamSize: text("team_size").notNull(), // 0, 1-5, 6-15, 16-50, 50+
  industry: text("industry").notNull(), // Technology, Healthcare, Finance, etc.
  yearsInLeadership: integer("years_in_leadership").notNull(), // 0-50
  workEnvironment: text("work_environment").notNull(), // Remote, Hybrid, In-Person
  organizationSize: text("organization_size"), // Startup, Small, Medium, Large, Enterprise
  leadershipChallenges: text("leadership_challenges").array(), // Primary pain points
  
  signupDate: timestamp("signup_date").defaultNow(),
  currentWeek: integer("current_week").default(0),
  isActive: boolean("is_active").default(true),
  lastEmailSent: timestamp("last_email_sent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailHistory = pgTable("email_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  subject: text("subject"),
  content: text("content"),
  actionItem: text("action_item"),
  sentDate: timestamp("sent_date").defaultNow(),
  deliveryStatus: text("delivery_status").default("sent"),
  openedAt: timestamp("opened_at"),
  clickCount: integer("click_count").default(0),
  resendId: text("resend_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  emailHistory: many(emailHistory),
}));

export const emailHistoryRelations = relations(emailHistory, ({ one }) => ({
  user: one(users, {
    fields: [emailHistory.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  timezone: true,
  goals: true,
  currentRole: true,
  teamSize: true,
  industry: true,
  yearsInLeadership: true,
  workEnvironment: true,
  organizationSize: true,
  leadershipChallenges: true,
}).extend({
  goals: z.array(z.string().min(1, "Goal cannot be empty")).min(1, "At least one goal is required").max(3, "Maximum 3 goals allowed"),
  currentRole: z.enum(["IC", "Manager", "Director", "VP", "C-Level"], {
    errorMap: () => ({ message: "Please select your current role level" })
  }),
  teamSize: z.enum(["0", "1-5", "6-15", "16-50", "50+"], {
    errorMap: () => ({ message: "Please select your team size" })
  }),
  industry: z.enum([
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
    "Retail", "Consulting", "Government", "Non-Profit", "Other"
  ], {
    errorMap: () => ({ message: "Please select your industry" })
  }),
  yearsInLeadership: z.number().min(0, "Years cannot be negative").max(50, "Please enter a valid number"),
  workEnvironment: z.enum(["Remote", "Hybrid", "In-Person"], {
    errorMap: () => ({ message: "Please select your work environment" })
  }),
  organizationSize: z.enum(["Startup", "Small", "Medium", "Large", "Enterprise"]).optional(),
  leadershipChallenges: z.array(z.string()).optional()
});

export const insertEmailHistorySchema = createInsertSchema(emailHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEmailHistory = z.infer<typeof insertEmailHistorySchema>;
export type EmailHistory = typeof emailHistory.$inferSelect;
