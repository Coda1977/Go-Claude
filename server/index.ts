import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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
    console.error(`[STARTUP ERROR] Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Application cannot start without these variables.');
    process.exit(1);
  }
  
  console.log(`[STARTUP] Environment validation passed. ${requiredEnvVars.length} variables configured.`);
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
  
  console.log(`[${new Date().toISOString()}] ${method} ${path} - ${ip}`);
  
  // Capture response timing
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusClass = Math.floor(statusCode / 100);
    
    let logLevel = 'INFO';
    if (statusClass === 4) logLevel = 'WARN';
    if (statusClass === 5) logLevel = 'ERROR';
    
    console.log(`[${new Date().toISOString()}] ${logLevel} ${method} ${path} ${statusCode} - ${duration}ms`);
    
    // Log slow requests (>5s)
    if (duration > 5000) {
      console.warn(`[SLOW REQUEST] ${method} ${path} took ${duration}ms`);
    }
    
    // Log errors with more details
    if (statusClass >= 4) {
      console.error(`[HTTP ERROR] ${statusCode} ${method} ${path} - IP: ${ip}`);
    }
  });
  
  next();
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] Received SIGTERM signal, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] Received SIGINT signal, shutting down gracefully...');
  process.exit(0);
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
