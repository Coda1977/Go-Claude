// Email Queue Reliability Testing Suite
const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// Helper function for admin API requests
async function adminRequest(method, endpoint, data = null) {
  // First authenticate as admin
  const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tinymanagerai@gmail.com' })
  });
  
  const setCookie = loginResponse.headers.get('set-cookie');
  
  // Make the actual request with admin session
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

// Test Suite 1: Email Queue Status
test('Email Queue Monitoring', async (t) => {
  await t.test('should return queue status', async () => {
    const response = await adminRequest('GET', '/api/admin/email-queue');
    
    assert.strictEqual(response.status, 200);
    assert.ok(typeof response.data.pending === 'number');
    assert.ok(typeof response.data.processing === 'boolean');
  });
});

// Test Suite 2: Email Processing Workflow
test('Email Processing Workflow', async (t) => {
  const testEmail = `queue-test-${Date.now()}@example.com`;
  let userId;
  
  await t.test('should queue welcome email on signup', async () => {
    const signupData = {
      email: testEmail,
      goals: ['Queue test goal', 'Email reliability test'],
      timezone: 'America/New_York'
    };
    
    const signupStart = Date.now();
    const response = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    const signupDuration = Date.now() - signupStart;
    
    const result = await response.json();
    
    assert.strictEqual(response.status, 200);
    assert.ok(result.userId);
    userId = result.userId;
    
    // Signup should be fast (under 3 seconds) due to async email processing
    assert.ok(signupDuration < 3000, `Signup took ${signupDuration}ms, should be under 3000ms`);
  });
  
  await t.test('should process email within 10 seconds', async () => {
    // Wait and check that email was processed
    let emailProcessed = false;
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds max wait
    
    while (!emailProcessed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      attempts++;
      
      try {
        const usersResponse = await adminRequest('GET', '/api/admin/users');
        if (usersResponse.status === 200) {
          const user = usersResponse.data.find(u => u.id === userId);
          if (user && user.emailHistory && user.emailHistory.length > 0) {
            const lastEmail = user.emailHistory[0];
            if (lastEmail.deliveryStatus === 'sent') {
              emailProcessed = true;
            }
          }
        }
      } catch (error) {
        // Continue waiting
      }
    }
    
    assert.ok(emailProcessed, `Email should be processed within ${maxAttempts * 0.5} seconds`);
  });
  
  await t.test('should update email status correctly', async () => {
    const usersResponse = await adminRequest('GET', '/api/admin/users');
    const user = usersResponse.data.find(u => u.id === userId);
    
    assert.ok(user);
    assert.ok(user.emailHistory.length > 0);
    
    const welcomeEmail = user.emailHistory[0];
    assert.strictEqual(welcomeEmail.deliveryStatus, 'sent');
    assert.ok(welcomeEmail.sentDate);
    assert.strictEqual(welcomeEmail.weekNumber, 1);
  });
});

// Test Suite 3: Queue Resilience
test('Email Queue Resilience', async (t) => {
  await t.test('should handle multiple concurrent signups', async () => {
    const concurrentSignups = 3;
    const promises = [];
    
    for (let i = 0; i < concurrentSignups; i++) {
      const signupData = {
        email: `concurrent-${i}-${Date.now()}@example.com`,
        goals: [`Concurrent test goal ${i}`],
        timezone: 'UTC'
      };
      
      promises.push(
        fetch(`${BASE_URL}/api/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupData)
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));
    
    // All signups should succeed
    responses.forEach(response => {
      assert.strictEqual(response.status, 200);
    });
    
    results.forEach(result => {
      assert.ok(result.userId);
    });
    
    // Wait for queue to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check queue status
    const queueResponse = await adminRequest('GET', '/api/admin/email-queue');
    assert.strictEqual(queueResponse.status, 200);
  });
});

// Test Suite 4: Email Content Validation
test('Email Content Quality', async (t) => {
  await t.test('should generate meaningful email content', async () => {
    const testEmail = `content-test-${Date.now()}@example.com`;
    
    const signupData = {
      email: testEmail,
      goals: ['Improve delegation skills', 'Build team trust'],
      timezone: 'America/Los_Angeles'
    };
    
    const signupResponse = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    
    const signupResult = await signupResponse.json();
    const userId = signupResult.userId;
    
    // Wait for email processing
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const usersResponse = await adminRequest('GET', '/api/admin/users');
    const user = usersResponse.data.find(u => u.id === userId);
    
    assert.ok(user);
    assert.ok(user.emailHistory.length > 0);
    
    const email = user.emailHistory[0];
    
    // Email should have substantial content
    assert.ok(email.content.length > 100, 'Email content should be substantial');
    assert.ok(email.actionItem.length > 50, 'Action item should be detailed');
    assert.ok(email.subject.length > 10, 'Subject should be meaningful');
    
    // Content should be related to goals
    const contentLower = email.content.toLowerCase();
    const actionLower = email.actionItem.toLowerCase();
    
    assert.ok(
      contentLower.includes('delegation') || contentLower.includes('trust') ||
      actionLower.includes('delegation') || actionLower.includes('trust'),
      'Email content should relate to user goals'
    );
  });
});

console.log('📧 Email Queue Tests: All reliability tests completed');