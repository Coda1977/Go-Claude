// API Endpoint Testing Suite
const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  
  return {
    status: response.status,
    data: result,
    headers: response.headers
  };
}

// Test Suite 1: Health Check
test('Health Check Endpoint', async (t) => {
  await t.test('should return healthy status', async () => {
    const response = await apiRequest('GET', '/api/health');
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.status, 'healthy');
    assert.ok(response.data.timestamp);
    assert.strictEqual(response.data.database, 'connected');
  });
});

// Test Suite 2: Signup Flow
test('User Signup Flow', async (t) => {
  const testEmail = `test-${Date.now()}@example.com`;
  
  await t.test('should successfully create new user', async () => {
    const signupData = {
      email: testEmail,
      goals: ['Test leadership goal', 'Improve team communication'],
      timezone: 'America/New_York'
    };
    
    const response = await apiRequest('POST', '/api/signup', signupData);
    
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.userId);
    assert.strictEqual(response.data.message, 'Signup successful');
  });
  
  await t.test('should reject duplicate email', async () => {
    const signupData = {
      email: testEmail,
      goals: ['Another goal'],
      timezone: 'America/Chicago'
    };
    
    const response = await apiRequest('POST', '/api/signup', signupData);
    
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.data.message, 'User already exists');
  });
  
  await t.test('should reject invalid data', async () => {
    const invalidData = {
      email: 'invalid-email',
      goals: [],
      timezone: 'invalid-timezone'
    };
    
    const response = await apiRequest('POST', '/api/signup', invalidData);
    
    assert.strictEqual(response.status, 400);
    assert.ok(response.data.message.includes('Invalid input data'));
  });
});

// Test Suite 3: Admin Authentication
test('Admin Authentication', async (t) => {
  let adminHeaders = {};
  
  await t.test('should grant admin access with correct email', async () => {
    const loginData = {
      email: 'tinymanagerai@gmail.com'
    };
    
    const response = await apiRequest('POST', '/api/admin/login', loginData);
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.isAdmin, true);
    
    // Extract session cookie for subsequent requests
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      adminHeaders.Cookie = setCookie;
    }
  });
  
  await t.test('should deny admin access with wrong email', async () => {
    const loginData = {
      email: 'wrong@example.com'
    };
    
    const response = await apiRequest('POST', '/api/admin/login', loginData);
    
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.data.message, 'Admin access denied');
  });
  
  await t.test('should access admin stats with valid session', async () => {
    const response = await apiRequest('GET', '/api/admin/stats', null, adminHeaders);
    
    assert.strictEqual(response.status, 200);
    assert.ok(typeof response.data.totalUsers === 'number');
    assert.ok(typeof response.data.activeUsers === 'number');
  });
  
  await t.test('should reject admin access without session', async () => {
    const response = await apiRequest('GET', '/api/admin/stats');
    
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.data.message, 'Admin access required');
  });
});

// Test Suite 4: Rate Limiting
test('Rate Limiting', async (t) => {
  await t.test('should enforce signup rate limiting', async () => {
    const promises = [];
    
    // Make 5 rapid signup attempts (limit is 3 per 15 minutes)
    for (let i = 0; i < 5; i++) {
      promises.push(
        apiRequest('POST', '/api/signup', {
          email: `rate-test-${i}-${Date.now()}@example.com`,
          goals: ['Test goal'],
          timezone: 'UTC'
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // First 3 should succeed or fail normally, last 2 should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    assert.ok(rateLimitedResponses.length >= 2, 'Rate limiting should block excess requests');
  });
});

console.log('🧪 API Tests: All endpoint tests completed');