#!/usr/bin/env node

// Test Runner for Phase 1 Critical Tests
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const testFiles = [
  'api.test.js',
  'email-queue.test.js', 
  'database.test.js'
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running ${testFile}...`);
    
    const testProcess = spawn('node', [path.join(__dirname, testFile)], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} passed`);
        resolve();
      } else {
        console.log(`❌ ${testFile} failed with code ${code}`);
        reject(new Error(`Test ${testFile} failed`));
      }
    });
  });
}

async function runAllTests() {
  console.log('🧪 Starting Phase 1 Critical Testing Suite');
  console.log('=====================================');
  
  const startTime = Date.now();
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testFile of testFiles) {
    try {
      await runTest(testFile);
      passedTests++;
    } catch (error) {
      failedTests++;
      console.error(`Test ${testFile} failed:`, error.message);
    }
  }
  
  const duration = Date.now() - startTime;
  
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${testFiles.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All Phase 1 critical tests passed! Ready for deployment.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('\n⏹️  Test run interrupted');
  process.exit(1);
});

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});