// SIMPLE JOBTRACKER DEBUG SCRIPT
// ==============================
// Run this in your browser console (F12) while on your JobTracker page

console.log('🚀 JobTracker Quick Debug');
console.log('========================');

// Step 1: Check if signed in
const user = firebase?.auth()?.currentUser;
if (!user) {
  console.log('❌ NOT SIGNED IN - Please sign in first');
} else {
  console.log('✅ Signed in as:', user.email);
  console.log('   User ID:', user.uid);
}

// Step 2: Quick job count check
async function checkJobs() {
  if (!user) {
    console.log('❌ Cannot check jobs - not signed in');
    return;
  }
  
  try {
    const db = firebase.firestore();
    const jobsQuery = db.collection('jobApplications').where('userId', '==', user.uid);
    const snapshot = await jobsQuery.get();
    
    console.log(`📊 Found ${snapshot.size} jobs for your account`);
    
    if (snapshot.size === 0) {
      console.log('⚠️  No jobs found - this is why your dashboard is empty');
      console.log('💡 Solution: Add a test job by running: addTestJob()');
    } else {
      console.log('✅ Jobs exist in database');
      snapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`   ${i+1}. ${data.companyName || data.company} - ${data.jobTitle || data.position}`);
      });
    }
  } catch (error) {
    console.log('❌ Database error:', error.message);
    if (error.code === 'permission-denied') {
      console.log('🚨 PERMISSION DENIED - Check Firestore rules in Firebase Console');
    }
  }
}

// Step 3: Add test job function
async function addTestJob() {
  if (!user) {
    console.log('❌ Cannot add job - not signed in');
    return;
  }
  
  try {
    const db = firebase.firestore();
    const testJob = {
      companyName: 'Google',
      jobTitle: 'Software Engineer',
      status: 'applied',
      dateApplied: new Date().toISOString().split('T')[0],
      userId: user.uid,
      source: 'manual',
      notes: 'Test job added by debug script'
    };
    
    const docRef = await db.collection('jobApplications').add(testJob);
    console.log('✅ Test job created with ID:', docRef.id);
    console.log('🔄 Refresh your page - you should now see the job!');
    
  } catch (error) {
    console.log('❌ Failed to create test job:', error.message);
  }
}

// Make functions global
window.checkJobs = checkJobs;
window.addTestJob = addTestJob;

// Auto-run the check
if (user) {
  console.log('\n🔍 Running automatic job check...');
  checkJobs();
} else {
  console.log('\n👉 Sign in first, then run: checkJobs()');
}

console.log('\n📋 Available commands:');
console.log('  checkJobs()    - Check how many jobs you have');
console.log('  addTestJob()   - Add a test job to verify everything works');
