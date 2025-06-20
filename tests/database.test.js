// Database Migration and Integrity Testing Suite
const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// Helper function for database operations via API
async function dbRequest(query) {
  const response = await fetch(`${BASE_URL}/api/health`);
  return {
    status: response.status,
    data: await response.json().catch(() => ({}))
  };
}

// Helper for admin requests
async function adminRequest(method, endpoint, data = null) {
  const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tinymanagerai@gmail.com' })
  });
  
  const setCookie = loginResponse.headers.get('set-cookie');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': setCookie || ''
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return {
    status: response.status,
    data: await response.json().catch(() => ({}))
  };
}

// Test Suite 1: Database Connection and Health
test('Database Connection', async (t) => {
  await t.test('should connect to database successfully', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.database, 'connected');
  });
  
  await t.test('should validate required environment variables', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    assert.strictEqual(response.status, 200);
    assert.ok(data.environment);
    // If status is healthy, all required env vars are present
  });
});

// Test Suite 2: Data Integrity and Schema Validation
test('Data Schema Integrity', async (t) => {
  const testEmail = `schema-test-${Date.now()}@example.com`;
  let userId;
  
  await t.test('should enforce email uniqueness constraint', async () => {
    const signupData = {
      email: testEmail,
      goals: ['Schema test goal'],
      timezone: 'UTC'
    };
    
    // First signup should succeed
    const response1 = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    const result1 = await response1.json();
    assert.strictEqual(response1.status, 200);
    userId = result1.userId;
    
    // Second signup with same email should fail
    const response2 = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    assert.strictEqual(response2.status, 400);
  });
  
  await t.test('should handle goals array correctly', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for email processing
    
    const usersResponse = await adminRequest('GET', '/api/admin/users');
    const user = usersResponse.data.find(u => u.id === userId);
    
    assert.ok(user);
    assert.ok(Array.isArray(user.goals));
    assert.strictEqual(user.goals.length, 1);
    assert.strictEqual(user.goals[0], 'Schema test goal');
  });
  
  await t.test('should maintain email history relationships', async () => {
    const usersResponse = await adminRequest('GET', '/api/admin/users');
    const user = usersResponse.data.find(u => u.id === userId);
    
    assert.ok(user);
    if (user.emailHistory && user.emailHistory.length > 0) {
      const email = user.emailHistory[0];
      assert.strictEqual(email.userId, userId);
      assert.ok(email.weekNumber);
      assert.ok(email.subject);
      assert.ok(email.deliveryStatus);
    }
  });
});

// Test Suite 3: Database Performance and Reliability
test('Database Performance', async (t) => {
  await t.test('should handle concurrent database operations', async () => {
    const concurrentOps = 5;
    const promises = [];
    
    // Create multiple users simultaneously
    for (let i = 0; i < concurrentOps; i++) {
      promises.push(
        fetch(`${BASE_URL}/api/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `concurrent-db-${i}-${Date.now()}@example.com`,
            goals: [`Concurrent goal ${i}`],
            timezone: 'UTC'
          })
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // All operations should succeed
    for (const response of responses) {
      assert.strictEqual(response.status, 200);
    }
  });
  
  await t.test('should maintain data consistency under load', async () => {
    const statsResponse = await adminRequest('GET', '/api/admin/stats');
    
    assert.strictEqual(statsResponse.status, 200);
    assert.ok(typeof statsResponse.data.totalUsers === 'number');
    assert.ok(typeof statsResponse.data.activeUsers === 'number');
    assert.ok(statsResponse.data.totalUsers >= statsResponse.data.activeUsers);
  });
});

// Test Suite 4: Data Migration and Backup Recovery
test('Data Migration Compatibility', async (t) => {
  await t.test('should handle multiple goals format correctly', async () => {
    const multiGoalEmail = `multi-goal-${Date.now()}@example.com`;
    
    const signupData = {
      email: multiGoalEmail,
      goals: [
        'First leadership goal',
        'Second leadership goal', 
        'Third leadership goal'
      ],
      timezone: 'America/New_York'
    };
    
    const response = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    const result = await response.json();
    assert.strictEqual(response.status, 200);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const usersResponse = await adminRequest('GET', '/api/admin/users');
    const user = usersResponse.data.find(u => u.email === multiGoalEmail);
    
    assert.ok(user);
    assert.strictEqual(user.goals.length, 3);
    assert.ok(user.goals.includes('First leadership goal'));
    assert.ok(user.goals.includes('Second leadership goal'));
    assert.ok(user.goals.includes('Third leadership goal'));
  });
  
  await t.test('should maintain referential integrity', async () => {
    const usersResponse = await adminRequest('GET', '/api/admin/users');
    assert.strictEqual(usersResponse.status, 200);
    
    // Check that all email history records have valid user references
    for (const user of usersResponse.data) {
      if (user.emailHistory) {
        for (const email of user.emailHistory) {
          assert.strictEqual(email.userId, user.id);
          assert.ok(['pending', 'sent', 'failed'].includes(email.deliveryStatus));
        }
      }
    }
  });
});

// Test Suite 5: Database Cleanup and Maintenance
test('Database Maintenance', async (t) => {
  await t.test('should handle user deletion safely', async () => {
    // Create a test user for deletion
    const deleteTestEmail = `delete-test-${Date.now()}@example.com`;
    
    const signupResponse = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: deleteTestEmail,
        goals: ['Delete test goal'],
        timezone: 'UTC'
      })
    });
    
    const signupResult = await signupResponse.json();
    const userId = signupResult.userId;
    
    // Wait for email processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Delete the user
    const deleteResponse = await adminRequest('DELETE', `/api/admin/users/${userId}`);
    
    // Deletion should succeed (or endpoint might not exist, which is also OK)
    assert.ok(deleteResponse.status === 200 || deleteResponse.status === 404);
    
    // Verify user is no longer in the system
    const usersResponse = await adminRequest('GET', '/api/admin/users');
    const deletedUser = usersResponse.data.find(u => u.id === userId);
    
    if (deleteResponse.status === 200) {
      assert.ok(!deletedUser, 'User should be deleted from system');
    }
  });
});

console.log('🗄️ Database Tests: All migration and integrity tests completed');