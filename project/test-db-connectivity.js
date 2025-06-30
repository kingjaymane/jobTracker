// Test database connectivity from Node.js
// This will help us identify the exact issue

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (if you have a service account key)
try {
  const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
  if (require('fs').existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id'
    });
    console.log('✅ Firebase Admin initialized with service account');
  } else {
    console.log('❌ Service account key not found. Testing client-side Firebase instead...');
    console.log('To test server-side:');
    console.log('1. Download service account key from Firebase Console');
    console.log('2. Save as service-account-key.json in project root');
    console.log('3. Run this script again');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

async function testDatabaseConnectivity() {
  try {
    console.log('\n🔧 TESTING DATABASE CONNECTIVITY');
    console.log('==================================');
    
    const db = admin.firestore();
    
    // Test 1: Check if we can access Firestore
    console.log('1. Testing Firestore connection...');
    const testDoc = await db.collection('test').doc('connectivity').get();
    console.log('✅ Firestore connection successful');
    
    // Test 2: Check current jobApplications collection structure
    console.log('\n2. Checking jobApplications collection...');
    const jobsSnapshot = await db.collection('jobApplications').limit(5).get();
    console.log(`   Found ${jobsSnapshot.size} documents in jobApplications collection`);
    
    if (!jobsSnapshot.empty) {
      console.log('   Sample documents:');
      jobsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: userId=${data.userId}, company=${data.companyName}, title=${data.jobTitle}`);
      });
    }
    
    // Test 3: Check users collection structure (as suggested by firestore.rules)
    console.log('\n3. Checking users collection structure...');
    const usersSnapshot = await db.collection('users').limit(3).get();
    console.log(`   Found ${usersSnapshot.size} documents in users collection`);
    
    if (!usersSnapshot.empty) {
      console.log('   Sample user documents:');
      for (const userDoc of usersSnapshot.docs) {
        console.log(`   - User: ${userDoc.id}`);
        
        // Check for jobs subcollection
        const jobsSubcollection = await userDoc.ref.collection('jobs').limit(3).get();
        console.log(`     Jobs in users/${userDoc.id}/jobs: ${jobsSubcollection.size} documents`);
        
        if (!jobsSubcollection.empty) {
          jobsSubcollection.forEach(jobDoc => {
            const jobData = jobDoc.data();
            console.log(`     - ${jobDoc.id}: ${jobData.companyName} - ${jobData.jobTitle}`);
          });
        }
      }
    }
    
    console.log('\n✅ Database connectivity test completed');
    
  } catch (error) {
    console.error('\n❌ Database connectivity test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDatabaseConnectivity().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
