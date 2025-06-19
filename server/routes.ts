import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { openaiService } from "./services/openai";
import { emailService } from "./services/email";
import { scheduler } from "./services/scheduler";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Security middleware
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: "Too many signup attempts, please try again later.",
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers
  app.use(helmet());

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json({ status: "healthy", stats });
    } catch (error) {
      res.status(500).json({ status: "unhealthy", error: error.message });
    }
  });

  // User signup endpoint
  app.post("/api/signup", signupLimiter, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user
      const user = await storage.createUser(validatedData);

      // Generate welcome email with AI analysis
      const goalAnalysis = await openaiService.analyzeGoals(validatedData.goals);
      
      // Send welcome email
      await emailService.sendWelcomeEmail(user, goalAnalysis);

      // Update user's current week to 1 and log email
      await storage.updateUser(user.id, { currentWeek: 1, lastEmailSent: new Date() });
      await storage.logEmailHistory({
        userId: user.id,
        weekNumber: 1,
        subject: "Welcome to Your Leadership Journey!",
        content: goalAnalysis.feedback,
        actionItem: goalAnalysis.firstAction,
      });

      res.json({ message: "Signup successful", userId: user.id });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin authentication endpoint
  app.post("/api/admin/login", adminLimiter, async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      
      if (password === adminPassword) {
        req.session.isAdmin = true;
        res.json({ message: "Login successful" });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin middleware
  const requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  // Admin endpoints
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:id/deactivate", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, { isActive: false });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deactivated", user });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/test-email", requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address required" });
      }
      
      await emailService.sendTestEmail(email);
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  app.post("/api/admin/trigger-weekly-emails", requireAdmin, async (req, res) => {
    try {
      const result = await scheduler.processWeeklyEmails();
      res.json({ message: "Weekly emails processed", result });
    } catch (error) {
      res.status(500).json({ message: "Failed to process weekly emails" });
    }
  });

  // Logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
  });

  // Initialize scheduler
  scheduler.scheduleWeeklyEmails();

  const httpServer = createServer(app);
  return httpServer;
}
