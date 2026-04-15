/**
 * Test script for Jarvis Enhanced Engine
 * 
 * This script tests the new QueryEngine-based architecture
 * to ensure proper integration and functionality.
 */

const API_URL = 'http://localhost:3000';

async function testEngineStatus() {
  console.log('\n🧪 Test 1: Engine Status');
  try {
    const response = await fetch(`${API_URL}/api/status`);
    const status = await response.json();
    console.log('✅ Engine Status:', status);
    return status.engine.includes('QueryEngine');
  } catch (error) {
    console.error('❌ Engine Status Test Failed:', error.message);
    return false;
  }
}

async function testBasicChat() {
  console.log('\n🧪 Test 2: Basic Chat');
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: "Hello Jarvis, what is your current configuration?",
      })
    });
    
    const result = await response.json();
    console.log('✅ Chat Response:', result.text.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Chat Test Failed:', error.message);
    return false;
  }
}

async function testCommandExecution() {
  console.log('\n🧪 Test 3: Direct Command Execution');
  try {
    const response = await fetch(`${API_URL}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'echo "Jarvis engine test successful"',
      })
    });
    
    const result = await response.json();
    console.log('✅ Command Result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Command Test Failed:', error.message);
    return false;
  }
}

async function testAutonomousTask() {
  console.log('\n🧪 Test 4: Autonomous Task');
  try {
    const response = await fetch(`${API_URL}/api/autonomous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: "Create a simple test file",
        goal: "Create a file named test.txt with 'Hello from Jarvis' content",
        maxSteps: 5
      })
    });
    
    const result = await response.json();
    console.log('✅ Autonomous Task Result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Autonomous Task Test Failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('  Jarvis Enhanced Engine - Test Suite');
  console.log('========================================');
  
  const results = {
    status: await testEngineStatus(),
    chat: await testBasicChat(),
    command: await testCommandExecution(),
    autonomous: await testAutonomousTask(),
  };
  
  console.log('\n========================================');
  console.log('  Test Results Summary');
  console.log('========================================');
  console.log(`✅ Engine Status: ${results.status ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Basic Chat: ${results.chat ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Command Execution: ${results.command ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Autonomous Task: ${results.autonomous ? 'PASS' : 'FAIL'}`);
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Jarvis Enhanced Engine is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.');
  }
}

// Run tests
runAllTests().catch(console.error);
