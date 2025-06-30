// COMPREHENSIVE JOBTRACKER DIAGNOSTIC - COPY TO BROWSER CONSOLE
// ==============================================================
// After updating Firestore rules, run this in browser console to diagnose the issue

console.log('🔧 JOBTRACKER DIAGNOSTIC - AFTER FIRESTORE RULES UPDATE');
console.log('=======================================================');

async function diagnoseJobTrackerIssue() {
    const results = {
        step1_auth: null,
        step2_firebaseConfig: null,
        step3_jobApplicationsCollection: null,
        step4_getJobApplicationsFunction: null,
        step5_createTestJob: null,
        errors: []
    };

    try {
        // STEP 1: Check Authentication
        console.log('\n1️⃣ CHECKING AUTHENTICATION...');
        console.log('--------------------------------');
        
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase not loaded globally');
            results.errors.push('Firebase not available in global scope');
            return results;
        }
        
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('❌ No authenticated user found');
            console.log('👉 SOLUTION: Sign in to JobTracker first, then run this diagnostic again');
            results.step1_auth = { status: 'failed', reason: 'not_signed_in' };
            return results;
        }
        
        console.log('✅ User authenticated:', currentUser.uid);
        console.log('   Email:', currentUser.email);
        results.step1_auth = { status: 'success', uid: currentUser.uid, email: currentUser.email };

        // STEP 2: Check Firebase Imports
        console.log('\n2️⃣ CHECKING FIREBASE IMPORTS...');
        console.log('----------------------------------');
        
        try {
            const { collection, getDocs, addDoc, query, where } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');
            console.log('✅ Firebase/Firestore imports successful');
            results.step2_firebaseConfig = { status: 'success' };
        } catch (importError) {
            console.error('❌ Failed to import Firebase/Firestore:', importError);
            results.step2_firebaseConfig = { status: 'failed', error: importError.message };
            results.errors.push(`Import error: ${importError.message}`);
            return results;
        }

        // STEP 3: Check jobApplications Collection
        console.log('\n3️⃣ CHECKING jobApplications COLLECTION...');
        console.log('-------------------------------------------');
        
        try {
            const { collection, getDocs, query, where } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');
            
            // Check total documents in jobApplications
            const allJobsRef = collection(db, 'jobApplications');
            const allJobsSnapshot = await getDocs(allJobsRef);
            console.log(`📊 Total documents in jobApplications collection: ${allJobsSnapshot.size}`);
            
            // Check user-specific documents
            const userJobsQuery = query(
                collection(db, 'jobApplications'),
                where('userId', '==', currentUser.uid)
            );
            const userJobsSnapshot = await getDocs(userJobsQuery);
            console.log(`📊 Documents for current user (${currentUser.uid}): ${userJobsSnapshot.size}`);
            
            if (userJobsSnapshot.size === 0) {
                console.log('⚠️  NO JOBS FOUND for current user in jobApplications collection');
                console.log('   This could mean:');
                console.log('   1. You haven\'t added any jobs yet');
                console.log('   2. Your jobs are in a different collection structure');
                console.log('   3. There\'s a userId mismatch');
                
                // Check if there are jobs with different userIds
                if (allJobsSnapshot.size > 0) {
                    console.log('\n🔍 ANALYZING EXISTING JOBS...');
                    const userIds = new Set();
                    allJobsSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.userId) {
                            userIds.add(data.userId);
                        }
                    });
                    console.log('   Found userIds in database:', Array.from(userIds));
                    console.log('   Your current userId:', currentUser.uid);
                    
                    if (!userIds.has(currentUser.uid)) {
                        console.log('❌ Your userId is NOT in the database');
                        console.log('   This suggests the jobs belong to a different user account');
                    }
                }
                
                results.step3_jobApplicationsCollection = { 
                    status: 'no_user_jobs', 
                    totalJobs: allJobsSnapshot.size,
                    userJobs: userJobsSnapshot.size 
                };
            } else {
                console.log('✅ Found jobs for current user:');
                userJobsSnapshot.forEach(doc => {
                    const data = doc.data();
                    console.log(`   - ${doc.id}: ${data.companyName} - ${data.jobTitle} (${data.status})`);
                });
                results.step3_jobApplicationsCollection = { 
                    status: 'success', 
                    totalJobs: allJobsSnapshot.size,
                    userJobs: userJobsSnapshot.size 
                };
            }
        } catch (collectionError) {
            console.error('❌ Error accessing jobApplications collection:', collectionError);
            results.step3_jobApplicationsCollection = { status: 'failed', error: collectionError.message };
            results.errors.push(`Collection access error: ${collectionError.message}`);
        }

        // STEP 4: Test getJobApplications Function
        console.log('\n4️⃣ TESTING getJobApplications FUNCTION...');
        console.log('--------------------------------------------');
        
        try {
            const { getJobApplications } = await import('./lib/firestore');
            console.log('🔄 Calling getJobApplications function...');
            const jobs = await getJobApplications(currentUser.uid);
            console.log(`✅ getJobApplications returned ${jobs.length} jobs`);
            
            if (jobs.length > 0) {
                console.log('📋 Jobs returned by function:');
                jobs.slice(0, 3).forEach(job => {
                    console.log(`   - ${job.id}: ${job.companyName} - ${job.jobTitle}`);
                });
            }
            
            results.step4_getJobApplicationsFunction = { status: 'success', jobCount: jobs.length };
        } catch (functionError) {
            console.error('❌ getJobApplications function failed:', functionError);
            results.step4_getJobApplicationsFunction = { status: 'failed', error: functionError.message };
            results.errors.push(`Function error: ${functionError.message}`);
        }

        // STEP 5: Try Creating a Test Job (if no jobs exist)
        if (results.step3_jobApplicationsCollection?.userJobs === 0) {
            console.log('\n5️⃣ CREATING TEST JOB...');
            console.log('-------------------------');
            
            try {
                const { addDoc, collection } = await import('firebase/firestore');
                const { db } = await import('./lib/firebase');
                
                const testJob = {
                    companyName: 'Test Company',
                    jobTitle: 'Test Position',
                    status: 'applied',
                    dateApplied: new Date().toISOString().split('T')[0],
                    notes: 'Test job created by diagnostic script',
                    userId: currentUser.uid,
                    source: 'Diagnostic Test',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                const docRef = await addDoc(collection(db, 'jobApplications'), testJob);
                console.log('✅ Test job created successfully with ID:', docRef.id);
                console.log('🔄 Now refresh your JobTracker dashboard - you should see the test job');
                
                results.step5_createTestJob = { status: 'success', jobId: docRef.id };
            } catch (createError) {
                console.error('❌ Failed to create test job:', createError);
                results.step5_createTestJob = { status: 'failed', error: createError.message };
                results.errors.push(`Test job creation error: ${createError.message}`);
            }
        }

        // SUMMARY
        console.log('\n📊 DIAGNOSTIC SUMMARY');
        console.log('=====================');
        console.log('Authentication:', results.step1_auth?.status || 'unknown');
        console.log('Firebase Imports:', results.step2_firebaseConfig?.status || 'unknown');
        console.log('Collection Access:', results.step3_jobApplicationsCollection?.status || 'unknown');
        console.log('Function Test:', results.step4_getJobApplicationsFunction?.status || 'unknown');
        if (results.step5_createTestJob) {
            console.log('Test Job Creation:', results.step5_createTestJob.status);
        }

        console.log('\n💡 NEXT STEPS:');
        console.log('---------------');
        if (results.step3_jobApplicationsCollection?.userJobs === 0 && results.step5_createTestJob?.status === 'success') {
            console.log('1. 🔄 Refresh your JobTracker dashboard');
            console.log('2. ✅ You should now see the test job');
            console.log('3. 📝 Try adding more jobs manually or via email scan');
        } else if (results.step4_getJobApplicationsFunction?.status === 'success' && results.step4_getJobApplicationsFunction?.jobCount > 0) {
            console.log('1. 🔄 Hard refresh your browser (Ctrl+F5)');
            console.log('2. 🧹 Clear browser cache and reload');
            console.log('3. 📝 Check for JavaScript errors in console');
        } else if (results.errors.length > 0) {
            console.log('1. 🔧 Fix the errors shown above');
            console.log('2. 📋 Update Firestore rules if permission errors persist');
            console.log('3. 🔄 Restart development server if import errors occur');
        }

        return results;

    } catch (error) {
        console.error('❌ Diagnostic failed completely:', error);
        return { error: error.message, results };
    }
}

// Quick test function
async function quickJobTest() {
    console.log('\n🚀 QUICK JOB TEST');
    console.log('=================');
    
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('❌ Not signed in');
        return;
    }
    
    try {
        const { getJobApplications } = await import('./lib/firestore');
        const jobs = await getJobApplications(user.uid);
        console.log(`✅ Found ${jobs.length} jobs for user ${user.uid}`);
        return jobs;
    } catch (error) {
        console.error('❌ Quick test failed:', error);
        return error;
    }
}

// Make functions available globally
window.diagnoseJobTrackerIssue = diagnoseJobTrackerIssue;
window.quickJobTest = quickJobTest;

console.log('🚀 DIAGNOSTIC TOOLS LOADED!');
console.log('============================');
console.log('Available commands:');
console.log('  await diagnoseJobTrackerIssue()  - Full comprehensive diagnostic');
console.log('  await quickJobTest()             - Quick test of job loading');
console.log('');
console.log('📝 Instructions:');
console.log('1. Make sure you are signed in to JobTracker');
console.log('2. Copy this entire script to your browser console');
console.log('3. Run: await diagnoseJobTrackerIssue()');
console.log('4. Follow the specific recommendations provided');
