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
  // Security headers with CSP configuration for development
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json({ status: "healthy", stats });
    } catch (error) {
      res.status(500).json({ status: "unhealthy", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get current user info (from Replit context)
  app.get("/api/user", async (req, res) => {
    try {
      // In Replit, user info is available via headers
      const replitUser = req.headers['x-replit-user-name'];
      const userEmail = req.headers['x-replit-user-email'] || `${replitUser}@replit.com`;
      
      if (!replitUser) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if user exists in our system
      const existingUser = await storage.getUserByEmail(userEmail as string);
      
      res.json({ 
        authenticated: true,
        email: userEmail,
        username: replitUser,
        isRegistered: !!existingUser,
        user: existingUser || null
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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
      
      // Log email first to get the email ID for tracking
      const emailRecord = await storage.logEmailHistory({
        userId: user.id,
        weekNumber: 1,
        subject: "Welcome to Your Leadership Journey!",
        content: goalAnalysis.feedback,
        actionItem: goalAnalysis.goalActions.map(ga => `${ga.goal}: ${ga.action}`).join('\n\n'),
      });
      
      // Send welcome email with tracking pixel
      await emailService.sendWelcomeEmail(user, goalAnalysis, emailRecord.id);

      // Update user's current week to 1
      await storage.updateUser(user.id, { currentWeek: 1, lastEmailSent: new Date() });

      res.json({ message: "Signup successful", userId: user.id });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin authentication endpoint - email-based access
  app.post("/api/admin/login", adminLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (email === "tinymanagerai@gmail.com") {
        (req.session as any).isAdmin = true;
        (req.session as any).userEmail = email;
        res.json({ message: "Admin access granted", isAdmin: true });
      } else {
        res.status(401).json({ message: "Admin access denied" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin middleware - restrict to specific email
  const requireAdmin = (req: any, res: any, next: any) => {
    const userEmail = req.session?.userEmail;
    if (userEmail !== "tinymanagerai@gmail.com") {
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
      // Get email history for each user
      const usersWithEmailData = await Promise.all(
        users.map(async (user) => {
          const emailHistory = await storage.getEmailHistory(user.id);
          return {
            ...user,
            emailsSent: emailHistory.length,
            lastEmailSent: emailHistory.length > 0 ? emailHistory[emailHistory.length - 1].sentDate : null,
            emailHistory
          };
        })
      );
      res.json(usersWithEmailData);
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

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Email tracking routes
  app.get("/api/email/track/:emailId", async (req, res) => {
    try {
      const emailId = parseInt(req.params.emailId);
      console.log(`Email tracking pixel requested for email ID: ${emailId}`);
      
      if (isNaN(emailId)) {
        console.error("Invalid email ID provided:", req.params.emailId);
        return res.status(400).send("Invalid email ID");
      }
      
      await storage.trackEmailOpen(emailId);
      console.log(`Email open tracked successfully for email ID: ${emailId}`);
      
      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64"
      );
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.send(pixel);
    } catch (error) {
      console.error("Email tracking error:", error);
      res.status(500).send("Error");
    }
  });

  app.get("/api/email/click/:emailId", async (req, res) => {
    try {
      const emailId = parseInt(req.params.emailId);
      await storage.trackEmailClick(emailId);
      
      const redirectUrl = req.query.url as string || "/";
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Click tracking error:", error);
      res.redirect("/");
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
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Initialize scheduler
  scheduler.scheduleWeeklyEmails();

  const httpServer = createServer(app);
  return httpServer;
}
