/**
 * Manual test for the Job Cleanup API
 * Open this in browser console to test the cleanup functionality
 */

// Test 1: Check if the cleanup API is available
async function testCleanupAPI() {
  console.log('🔍 Testing Cleanup API availability...');
  
  try {
    const response = await fetch('/api/jobs/cleanup', {
      method: 'GET'
    });
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    if (data.success) {
      console.log('✅ Cleanup API is working correctly');
      return true;
    } else {
      console.error('❌ API test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ API test error:', error);
    return false;
  }
}

// Test 2: Check authentication and user context
function testAuthentication() {
  console.log('🔍 Testing Authentication...');
  
  // Check if Firebase auth is available
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      console.log('✅ User authenticated:', currentUser.uid);
      return currentUser.uid;
    } else {
      console.error('❌ No authenticated user found');
      return null;
    }
  } else {
    console.error('❌ Firebase auth not available');
    return null;
  }
}

// Test 3: Test the analyze functionality with actual user
async function testAnalyzeJobs(userId) {
  console.log('🔍 Testing Job Analysis...');
  
  if (!userId) {
    console.error('❌ No user ID provided');
    return false;
  }
  
  try {
    const response = await fetch('/api/jobs/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        mode: 'analyze'
      }),
    });
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Analysis results:', data);
    
    if (data.success) {
      console.log('📈 Analysis summary:', data.analysis);
      return true;
    } else {
      console.error('❌ Analysis failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Analysis error:', error);
    return false;
  }
}

// Main test runner
async function runCleanupTests() {
  console.log('🚀 Starting Job Cleanup API Tests\n');
  
  // Test 1: API availability
  const apiWorking = await testCleanupAPI();
  if (!apiWorking) {
    console.log('\n❌ API test failed. Check server and routes.');
    return;
  }
  
  console.log('\n');
  
  // Test 2: Authentication
  const userId = testAuthentication();
  if (!userId) {
    console.log('\n❌ Authentication test failed. Make sure you are signed in.');
    return;
  }
  
  console.log('\n');
  
  // Test 3: Analyze jobs
  const analysisWorking = await testAnalyzeJobs(userId);
  if (!analysisWorking) {
    console.log('\n❌ Analysis test failed. Check console for details.');
    return;
  }
  
  console.log('\n✅ All tests passed! The cleanup tool should work correctly.');
}

// Instructions for use
console.log(`
🔧 JOB CLEANUP API TEST SUITE
=============================

To test the cleanup functionality:

1. Make sure you are signed in to JobTracker
2. Open the browser console (F12)
3. Copy and paste this entire script
4. Run: runCleanupTests()

Individual tests:
- testCleanupAPI() - Test if API is available
- testAuthentication() - Check if user is signed in  
- testAnalyzeJobs(userId) - Test job analysis

If tests fail, check:
- Development server is running (npm run dev)
- You are signed in to the app
- Firebase is properly configured
- No console errors on the page
`);

// Export for use
window.runCleanupTests = runCleanupTests;
window.testCleanupAPI = testCleanupAPI;
window.testAuthentication = testAuthentication;
window.testAnalyzeJobs = testAnalyzeJobs;
