# Testing Guide

## Overview

This project uses Jest for unit and integration testing with comprehensive test coverage for all critical components.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for API endpoints
├── global-setup.ts # Global test setup
└── global-teardown.ts # Global test cleanup
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

## Test Categories

### Unit Tests
- **Email Service**: Tests email sending functionality with mocked Resend API
- **Redis Queue**: Tests queue operations with mocked Redis
- **Monitoring Service**: Tests health checks and metrics collection
- **Logger Service**: Tests logging configuration and output

### Integration Tests
- **API Endpoints**: Tests all REST API endpoints
- **Authentication**: Tests admin access controls
- **Error Handling**: Tests error responses and validation
- **Database Operations**: Tests database interactions

## Test Configuration

### Environment Variables
Tests use the following environment variables:
- `NODE_ENV=test`
- `DATABASE_URL=postgresql://test:test@localhost:5432/test_db`
- `REDIS_HOST=localhost`
- `OPENAI_API_KEY=test-key`
- `RESEND_API_KEY=test-key`

### Mocking
External services are mocked:
- OpenAI API calls
- Resend email service
- Redis operations
- Database connections

## Coverage Goals

- **Overall Coverage**: >80%
- **Critical Paths**: >95%
- **Services**: >90%
- **API Endpoints**: >85%

## Running Tests Locally

1. Install dependencies:
```bash
npm install
```

2. Start test database (if needed):
```bash
docker run -d --name test-postgres -p 5432:5432 -e POSTGRES_DB=test_db -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test postgres:15
```

3. Start Redis (if needed):
```bash
docker run -d --name test-redis -p 6379:6379 redis:7
```

4. Run tests:
```bash
npm test
```

## Writing Tests

### Unit Test Example
```typescript
describe('EmailService', () => {
  it('should send email successfully', async () => {
    // Mock dependencies
    const mockSend = jest.fn().mockResolvedValue({
      data: { id: 'test-id' },
      error: null
    });
    
    // Test implementation
    const result = await emailService.sendEmail(data);
    
    // Assertions
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(expectedData);
  });
});
```

### Integration Test Example
```typescript
describe('API Integration', () => {
  it('should return user data', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200);
    
    expect(response.body).toHaveProperty('id', 1);
  });
});
```

## Debugging Tests

### Common Issues
1. **Database Connection**: Ensure test database is running
2. **Redis Connection**: Ensure Redis is available for queue tests
3. **Environment Variables**: Check all required env vars are set
4. **Mocking**: Verify mocks are properly configured

### Debug Commands
```bash
# Run specific test file
npm test -- email.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests with debug info
DEBUG=* npm test
```