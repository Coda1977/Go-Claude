import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  timezone: text("timezone").notNull(),
  goals: text("goals").array().notNull(),
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
}).extend({
  goals: z.array(z.string().min(1, "Goal cannot be empty")).min(1, "At least one goal is required").max(3, "Maximum 3 goals allowed")
});

export const insertEmailHistorySchema = createInsertSchema(emailHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEmailHistory = z.infer<typeof insertEmailHistorySchema>;
export type EmailHistory = typeof emailHistory.$inferSelect;
