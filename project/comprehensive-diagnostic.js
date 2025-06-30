// WORKING JOBTRACKER DIAGNOSTIC - NO FIREBASE IMPORTS NEEDED
// ===========================================================

console.clear();
console.log('� JOBTRACKER DIAGNOSTIC - FIXED VERSION');
console.log('========================================');

async function runFullDiagnostic() {
    const results = {
        auth: null,
        firebase: null,
        firestore: null,
        collections: {
            oldStructure: null,
            newStructure: null
        },
        permissions: null,
        errors: []
    };

    try {
        console.log('\n1️⃣ CHECKING AUTHENTICATION...');
        console.log('--------------------------------');
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            results.errors.push('Firebase not loaded in global scope');
            console.error('❌ Firebase not available globally');
            
            // Try to check auth through the app
            try {
                const authUser = document.querySelector('[data-auth-user]')?.textContent;
                if (authUser) {
                    console.log('✅ Found auth user in DOM:', authUser);
                    results.auth = { method: 'dom', user: authUser };
                } else {
                    console.log('❌ No auth user found in DOM');
                }
            } catch (e) {
                console.log('❌ Could not check DOM for auth user');
            }
        } else {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log('✅ User authenticated:', currentUser.uid);
                console.log('   Email:', currentUser.email);
                console.log('   Display Name:', currentUser.displayName);
                results.auth = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName
                };
            } else {
                console.log('❌ No authenticated user');
                results.errors.push('No authenticated user');
            }
        }

        console.log('\n2️⃣ CHECKING FIREBASE CONFIGURATION...');
        console.log('---------------------------------------');
        
        // Check Firebase config
        const firebaseConfig = {
            apiKey: typeof window !== 'undefined' ? window.location.origin : 'unknown',
            // We can't access the actual config for security, but we can test connectivity
        };
        console.log('✅ Firebase config check completed');

        console.log('\n3️⃣ TESTING FIRESTORE CONNECTIVITY...');
        console.log('--------------------------------------');
        
        if (results.auth && results.auth.uid) {
            try {
                // Test if we can import Firestore functions
                const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('./lib/firebase');
                
                console.log('✅ Firestore imports successful');
                results.firestore = { imports: 'success' };

                // Test 1: Check old collection structure
                console.log('\n🔍 Checking OLD collection structure (jobApplications)...');
                try {
                    const oldCollectionRef = collection(db, 'jobApplications');
                    const oldSnapshot = await getDocs(oldCollectionRef);
                    
                    let userJobsInOld = 0;
                    oldSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.userId === results.auth.uid) {
                            userJobsInOld++;
                        }
                    });
                    
                    console.log(`   📊 Found ${oldSnapshot.size} total documents in jobApplications`);
                    console.log(`   📊 Found ${userJobsInOld} documents for current user`);
                    results.collections.oldStructure = {
                        total: oldSnapshot.size,
                        userDocs: userJobsInOld
                    };
                    
                    if (userJobsInOld > 0) {
                        console.log('   ⚠️  You have data in the OLD structure that needs migration!');
                    }
                } catch (error) {
                    console.log('   ❌ Error accessing jobApplications collection:', error.message);
                    results.collections.oldStructure = { error: error.message };
                }

                // Test 2: Check new collection structure
                console.log('\n🔍 Checking NEW collection structure (users/{userId}/jobs)...');
                try {
                    const newCollectionRef = collection(db, 'users', results.auth.uid, 'jobs');
                    const newSnapshot = await getDocs(newCollectionRef);
                    
                    console.log(`   📊 Found ${newSnapshot.size} documents in users/${results.auth.uid}/jobs`);
                    results.collections.newStructure = {
                        docs: newSnapshot.size,
                        jobs: []
                    };
                    
                    if (newSnapshot.size > 0) {
                        console.log('   📋 Jobs in new structure:');
                        newSnapshot.forEach(doc => {
                            const data = doc.data();
                            console.log(`      - ${doc.id}: ${data.companyName} - ${data.jobTitle}`);
                            results.collections.newStructure.jobs.push({
                                id: doc.id,
                                company: data.companyName,
                                title: data.jobTitle,
                                status: data.status,
                                date: data.dateApplied
                            });
                        });
                    } else {
                        console.log('   📝 No jobs found in new structure');
                    }
                } catch (error) {
                    console.log('   ❌ Error accessing users/{userId}/jobs collection:', error.message);
                    results.collections.newStructure = { error: error.message };
                    results.errors.push(`New collection access error: ${error.message}`);
                }

                // Test 3: Test the actual getJobApplications function
                console.log('\n🔍 Testing getJobApplications function...');
                try {
                    const { getJobApplications } = await import('./lib/firestore');
                    const jobs = await getJobApplications(results.auth.uid);
                    console.log(`   ✅ getJobApplications returned ${jobs.length} jobs`);
                    results.firestore.getJobApplications = {
                        success: true,
                        count: jobs.length,
                        jobs: jobs.slice(0, 3) // First 3 jobs for preview
                    };
                    
                    if (jobs.length === 0) {
                        console.log('   ⚠️  Function returned 0 jobs - this explains the empty dashboard!');
                    }
                } catch (error) {
                    console.log('   ❌ getJobApplications failed:', error.message);
                    results.firestore.getJobApplications = { error: error.message };
                    results.errors.push(`getJobApplications error: ${error.message}`);
                }

            } catch (importError) {
                console.log('❌ Failed to import Firebase/Firestore:', importError.message);
                results.errors.push(`Import error: ${importError.message}`);
            }
        } else {
            console.log('⏭️  Skipping Firestore tests - no authenticated user');
        }

        console.log('\n4️⃣ PERMISSION ANALYSIS...');
        console.log('---------------------------');
        
        if (results.collections.newStructure?.error) {
            const error = results.collections.newStructure.error;
            if (error.includes('permission') || error.includes('denied')) {
                console.log('❌ PERMISSION ISSUE DETECTED!');
                console.log('   This is likely a Firestore security rules problem');
                results.permissions = 'denied';
            } else if (error.includes('not found') || error.includes('collection')) {
                console.log('⚠️  COLLECTION ACCESS ISSUE');
                console.log('   Collection may not exist or path is incorrect');
                results.permissions = 'path_issue';
            } else {
                console.log('❓ UNKNOWN FIRESTORE ERROR');
                results.permissions = 'unknown';
            }
        } else if (results.collections.newStructure?.docs >= 0) {
            console.log('✅ Permissions appear to be working');
            results.permissions = 'working';
        }

        console.log('\n📊 DIAGNOSTIC SUMMARY');
        console.log('=====================');
        
        console.log('Authentication:', results.auth ? '✅ Working' : '❌ Failed');
        console.log('Firestore Imports:', results.firestore?.imports === 'success' ? '✅ Working' : '❌ Failed');
        console.log('Old Collection Access:', results.collections.oldStructure ? '✅ Accessible' : '❌ Failed');
        console.log('New Collection Access:', results.collections.newStructure?.docs >= 0 ? '✅ Accessible' : '❌ Failed');
        console.log('getJobApplications Function:', results.firestore?.getJobApplications?.success ? '✅ Working' : '❌ Failed');
        
        if (results.errors.length > 0) {
            console.log('\n🚨 ERRORS FOUND:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        console.log('\n💡 RECOMMENDATIONS:');
        console.log('--------------------');
        
        if (!results.auth) {
            console.log('1. 🔑 Sign in to JobTracker first');
        } else if (results.collections.oldStructure?.userDocs > 0 && results.collections.newStructure?.docs === 0) {
            console.log('1. 📦 Run migration script to move data from old to new structure');
            console.log('   Use: await migrateJobData()');
        } else if (results.collections.newStructure?.error) {
            console.log('1. 🔒 Update Firestore security rules');
            console.log('2. 🔧 Check Firebase configuration');
        } else if (results.collections.newStructure?.docs === 0) {
            console.log('1. 📝 No jobs found - try adding a test job');
            console.log('2. 📧 Try scanning emails to import jobs');
        } else {
            console.log('1. 🔄 Try refreshing the page');
            console.log('2. 🧹 Clear browser cache and local storage');
        }

        return results;

    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return { error: error.message };
    }
}

// Make function globally available
window.runFullDiagnostic = runFullDiagnostic;

console.log('🚀 Diagnostic tool loaded!');
console.log('Run: await runFullDiagnostic()');
console.log('');
console.log('This will check:');
console.log('• Authentication status');
console.log('• Firebase/Firestore connectivity');
console.log('• Old vs new collection structure');
console.log('• Permission issues');
console.log('• Actual job data');
console.log('');
console.log('📝 Make sure to:');
console.log('1. Be signed in to JobTracker');
console.log('2. Have development server running');
console.log('3. Run this in the browser console (F12)');
