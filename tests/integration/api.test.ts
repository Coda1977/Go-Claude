import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

// Mock all external dependencies
jest.mock('../../server/services/openai');
jest.mock('../../server/services/email');
jest.mock('../../server/services/logger');
jest.mock('../../server/services/monitoring');
jest.mock('../../server/storage');

describe('API Integration Tests', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req, res, next) => {
      (req as any).session = {};
      next();
    });
    
    await registerRoutes(app);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication', () => {
    it('should require admin access for metrics endpoint', async () => {
      await request(app)
        .get('/api/metrics')
        .expect(403);
    });

    it('should allow admin access to metrics endpoint', async () => {
      const agent = request.agent(app);
      
      // Mock admin session
      const mockApp = express();
      mockApp.use((req, res, next) => {
        (req as any).session = { isAdmin: true };
        next();
      });
      
      await registerRoutes(mockApp);
      
      await request(mockApp)
        .get('/api/metrics')
        .expect(200);
    });
  });

  describe('User Registration', () => {
    it('should validate user registration data', async () => {
      const invalidData = {
        email: 'invalid-email',
        goals: [],
        timezone: 'invalid-timezone'
      };

      await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);
    });

    it('should accept valid user registration data', async () => {
      const validData = {
        email: 'test@example.com',
        goals: ['Leadership', 'Communication'],
        timezone: 'America/New_York'
      };

      // Mock storage response
      const mockStorage = require('../../server/storage').storage;
      mockStorage.insertUser.mockResolvedValue({
        id: 1,
        ...validData,
        currentWeek: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await request(app)
        .post('/api/users')
        .send(validData)
        .expect(201);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockStorage = require('../../server/storage').storage;
      mockStorage.getStats.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/health')
        .expect(503);
    });

    it('should handle invalid JSON payload', async () => {
      await request(app)
        .post('/api/users')
        .send('invalid json')
        .type('application/json')
        .expect(400);
    });
  });
});