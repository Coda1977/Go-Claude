// Global test setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.OPENAI_API_KEY = 'test-key';
process.env.RESEND_API_KEY = 'test-key';
process.env.SESSION_SECRET = 'test-secret';

// Mock external services
jest.mock('./server/services/openai', () => ({
  openaiService: {
    analyzeGoals: jest.fn(),
    generateWeeklyContent: jest.fn(),
    generateSubjectLine: jest.fn()
  }
}));

jest.mock('./server/services/email', () => ({
  emailService: {
    sendWelcomeEmail: jest.fn(),
    sendWeeklyEmail: jest.fn(),
    sendTestEmail: jest.fn()
  }
}));

// Increase timeout for integration tests
jest.setTimeout(30000);