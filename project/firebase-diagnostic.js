/**
 * Firebase Connection Diagnostic Tool
 * Use this in browser console to test Firebase/Firestore connectivity
 */

// Test Firebase Authentication
async function testFirebaseAuth() {
  console.log('🔍 Testing Firebase Authentication...');
  
  try {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase is not loaded');
      return false;
    }
    
    // Check current user
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      console.log('✅ User is authenticated');
      console.log('   User ID:', currentUser.uid);
      console.log('   Email:', currentUser.email);
      return currentUser.uid;
    } else {
      console.error('❌ No authenticated user found');
      console.log('   Please sign in to the application first');
      return null;
    }
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return null;
  }
}

// Test Firestore Database Access
async function testFirestoreAccess(userId) {
  console.log('🔍 Testing Firestore Database Access...');
  
  if (!userId) {
    console.error('❌ No user ID provided');
    return false;
  }
  
  try {
    // Try to access the jobs collection
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('/lib/firebase.js');
    
    console.log('📡 Attempting to read jobs collection...');
    const jobsRef = collection(db, 'users', userId, 'jobs');
    
    const startTime = Date.now();
    const snapshot = await getDocs(jobsRef);
    const endTime = Date.now();
    
    console.log(`✅ Database access successful (${endTime - startTime}ms)`);
    console.log('   Jobs found:', snapshot.docs.length);
    
    // List some basic info about jobs
    snapshot.docs.forEach((doc, index) => {
      if (index < 3) { // Show first 3 jobs
        const data = doc.data();
        console.log(`   Job ${index + 1}:`, {
          id: doc.id,
          company: data.company || data.companyName,
          position: data.position || data.jobTitle,
          hasEmail: !!(data.emailFrom || data.emailSubject)
        });
      }
    });
    
    if (snapshot.docs.length > 3) {
      console.log(`   ... and ${snapshot.docs.length - 3} more jobs`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Database access failed:', error);
    console.log('   Error details:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('🔧 This is a Firestore security rules issue');
      console.log('   Solution: Update your Firestore rules to allow access');
    }
    
    return false;
  }
}

// Test the cleanup API specifically
async function testCleanupAPIAccess(userId) {
  console.log('🔍 Testing Cleanup API Access...');
  
  if (!userId) {
    console.error('❌ No user ID provided');
    return false;
  }
  
  try {
    console.log('📡 Testing cleanup API...');
    
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
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Cleanup API working correctly');
      console.log('   Results:', data);
      return true;
    } else {
      console.error('❌ Cleanup API failed');
      console.log('   Status:', response.status);
      console.log('   Response:', responseText);
      
      // Try to parse error if it's JSON
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.details) {
          console.log('   Error details:', errorData.details);
        }
      } catch (e) {
        // Response is not JSON
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Check Firebase configuration
function checkFirebaseConfig() {
  console.log('🔍 Checking Firebase Configuration...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  let allConfigured = true;
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value.substring(0, 10)}...`);
    } else {
      console.error(`❌ ${envVar}: Missing`);
      allConfigured = false;
    }
  });
  
  if (allConfigured) {
    console.log('✅ All Firebase environment variables are configured');
  } else {
    console.error('❌ Some Firebase environment variables are missing');
    console.log('   Check your .env.local file');
  }
  
  return allConfigured;
}

// Main diagnostic function
async function diagnoseFirebaseIssues() {
  console.log('🚀 Firebase Diagnostic Tool');
  console.log('===========================\n');
  
  // Step 1: Check configuration
  console.log('Step 1: Configuration Check');
  const configOk = checkFirebaseConfig();
  console.log('');
  
  if (!configOk) {
    console.log('❌ Configuration issues found. Fix these first.');
    return;
  }
  
  // Step 2: Check authentication
  console.log('Step 2: Authentication Check');
  const userId = await testFirebaseAuth();
  console.log('');
  
  if (!userId) {
    console.log('❌ Authentication issues found. Sign in first.');
    return;
  }
  
  // Step 3: Check database access
  console.log('Step 3: Database Access Check');
  const dbOk = await testFirestoreAccess(userId);
  console.log('');
  
  if (!dbOk) {
    console.log('❌ Database access issues found. Check Firestore rules.');
    console.log('   Recommended Firestore rules:');
    console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
    `);
    return;
  }
  
  // Step 4: Check cleanup API
  console.log('Step 4: Cleanup API Check');
  const apiOk = await testCleanupAPIAccess(userId);
  console.log('');
  
  if (apiOk) {
    console.log('🎉 All tests passed! The cleanup tool should work correctly.');
  } else {
    console.log('❌ API issues found. Check server logs.');
  }
}

// Instructions
console.log(`
🔧 FIREBASE DIAGNOSTIC TOOL
============================

To diagnose Firebase/Firestore issues:

1. Make sure you're signed in to JobTracker
2. Open browser console (F12)
3. Copy and paste this script
4. Run: diagnoseFirebaseIssues()

Individual tests:
- checkFirebaseConfig() - Check environment variables
- testFirebaseAuth() - Test if user is signed in
- testFirestoreAccess(userId) - Test database access
- testCleanupAPIAccess(userId) - Test cleanup API

If database access fails with permissions error:
1. Go to Firebase Console → Firestore → Rules
2. Update rules to allow user access
3. Wait 1-2 minutes for rules to propagate
4. Try again
`);

// Export functions to window for easy access
window.diagnoseFirebaseIssues = diagnoseFirebaseIssues;
window.checkFirebaseConfig = checkFirebaseConfig;
window.testFirebaseAuth = testFirebaseAuth;
window.testFirestoreAccess = testFirestoreAccess;
window.testCleanupAPIAccess = testCleanupAPIAccess;
