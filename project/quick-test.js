// Quick Test Script to Check Job Data
// Run this in the browser console after signing in

console.log('🔍 QUICK JOB DATA CHECK');
console.log('======================');

async function quickDataCheck() {
    try {
        // Import Firebase Auth and get current user
        const { auth } = await import('./lib/firebase');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        // Get current user using the modern Firebase Auth
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('❌ No authenticated user found. Please sign in first.');
            console.log('💡 Make sure you are signed in to JobTracker');
            return;
        }
        
        console.log('✅ User authenticated:', currentUser.uid);
        console.log('   Email:', currentUser.email);
        
        // Import Firebase functions
        const { collection, getDocs, addDoc, query, where } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        
        // Test 1: Check current collection structure (jobApplications)
        console.log('\n1️⃣ Checking jobApplications collection...');
        const jobAppsQuery = query(
            collection(db, 'jobApplications'),
            where('userId', '==', currentUser.uid)
        );
        const jobAppsSnapshot = await getDocs(jobAppsQuery);
        console.log(`Found ${jobAppsSnapshot.size} jobs in jobApplications collection`);
        
        if (jobAppsSnapshot.size > 0) {
            console.log('✅ Jobs found in jobApplications collection:');
            jobAppsSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${data.companyName || data.company} - ${data.jobTitle || data.position} (${data.status})`);
            });
            
            return { status: 'jobs_found', count: jobAppsSnapshot.size };
        }
        
        // Test 2: Check old nested structure (users/{userId}/jobs)  
        console.log('\n2️⃣ Checking users/{userId}/jobs collection...');
        const nestedCollectionRef = collection(db, 'users', currentUser.uid, 'jobs');
        const nestedSnapshot = await getDocs(nestedCollectionRef);
        console.log(`Found ${nestedSnapshot.size} jobs in nested structure`);
        
        
        if (nestedSnapshot.size > 0) {
            console.log('⚠️  MIGRATION NEEDED!');
            console.log('Your jobs are in the old nested structure:');
            nestedSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${data.companyName} - ${data.jobTitle}`);
            });
            console.log('You need to migrate these to the flat jobApplications collection');
            return { status: 'migration_needed', oldJobs: nestedSnapshot.size };
        }
        
        console.log('\n🆕 NO JOBS FOUND ANYWHERE');
        console.log('This means you need to add some jobs. Let me create a test job...');
        
        // Test 3: Try adding a test job to the correct collection
        console.log('\n3️⃣ Testing job creation in jobApplications collection...');
        try {
            const testJob = {
                companyName: 'ACME Corporation',
                jobTitle: 'Software Engineer',
                status: 'applied',
                dateApplied: new Date().toISOString().split('T')[0],
                notes: 'Test job created by diagnostic script',
                source: 'manual',
                userId: currentUser.uid  // Important: include userId
            };
            
            const docRef = await addDoc(collection(db, 'jobApplications'), {
                ...testJob,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log('✅ Test job created successfully with ID:', docRef.id);
            console.log('🔄 Refresh the dashboard to see the test job');
            
            return { status: 'test_job_created', jobId: docRef.id };
        } catch (addError) {
            console.error('❌ Failed to create test job:', addError);
            if (addError.code === 'permission-denied') {
                console.log('🚨 PERMISSION DENIED - Your Firestore rules need to be updated!');
                console.log('📋 Go to Firebase Console → Firestore Database → Rules');
                console.log('📋 Make sure the rules allow access to jobApplications collection');
            }
            return { status: 'creation_failed', error: addError.message };
        }
        
    } catch (error) {
        console.error('❌ Quick data check failed:', error);
        return { status: 'error', error: error.message };
    }
}

// Test the getJobApplications function directly
async function testGetJobApplications() {
    try {
        console.log('\n🧪 TESTING getJobApplications FUNCTION');
        console.log('=====================================');
        
        const { auth } = await import('./lib/firebase');
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('❌ No authenticated user');
            return;
        }
        
        const { getJobApplications } = await import('./lib/firestore');
        console.log('✅ Imported getJobApplications function');
        
        console.log('🔄 Calling getJobApplications...');
        const jobs = await getJobApplications(currentUser.uid);
        
        console.log('✅ getJobApplications completed successfully');
        console.log(`📊 Returned ${jobs.length} jobs:`, jobs);
        
        return jobs;
    } catch (error) {
        console.error('❌ getJobApplications test failed:', error);
        throw error;
    }
}

// Make functions available globally
window.quickDataCheck = quickDataCheck;
window.testGetJobApplications = testGetJobApplications;

console.log('🚀 Quick test loaded!');
console.log('Commands:');
console.log('  await quickDataCheck()        - Check for job data and create test job if needed');
console.log('  await testGetJobApplications() - Test the actual function used by the app');
