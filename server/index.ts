import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./services/logger";
import { monitoringService } from "./services/monitoring";

// Environment validation on startup
function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY', 
    'RESEND_API_KEY',
    'SESSION_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    logger.error('Application cannot start without these variables.');
    process.exit(1);
  }
  
  logger.info(`Environment validation passed. ${requiredEnvVars.length} variables configured.`);
}

// Validate environment before starting server
validateEnvironment();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'go-leadership-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

// Enhanced request/response logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Skip logging for health checks and static assets
  if (path === '/api/health' || path.startsWith('/assets/')) {
    return next();
  }
  
  logger.info(`${method} ${path}`, { ip, path, method });
  
  // Capture response timing
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusClass = Math.floor(statusCode / 100);
    
    const logData = {
      method,
      path,
      statusCode,
      duration,
      ip
    };
    
    if (statusClass >= 5) {
      logger.error(`${method} ${path} ${statusCode}`, logData);
    } else if (statusClass >= 4) {
      logger.warn(`${method} ${path} ${statusCode}`, logData);
    } else {
      logger.info(`${method} ${path} ${statusCode}`, logData);
    }
    
    // Log slow requests (>5s)
    if (duration > 5000) {
      logger.warn(`Slow request: ${method} ${path} took ${duration}ms`, logData);
    }
    
    // Log performance metrics
    monitoringService.logPerformanceMetric(
      `${method} ${path}`,
      duration,
      statusClass < 4
    );
  });
  
  next();
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully...');
  await gracefulShutdown();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    logger.info('Starting graceful shutdown...');
    
    // Shutdown services
    monitoringService.shutdown();
    
    // Import and shutdown Redis queue
    const { redisEmailQueue } = await import('./services/redis-email-queue');
    await redisEmailQueue.shutdown();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Error handling ${req.method} ${req.path}:`, {
      status,
      message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
