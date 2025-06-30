// BROWSER-FRIENDLY JOBTRACKER DEBUG SCRIPT
// ==========================================
// This version works directly in the browser console

console.log('🔍 SIMPLE JOBTRACKER DEBUG');
console.log('==========================');

async function simpleDebug() {
    try {
        console.log('1️⃣ Checking if you are on the JobTracker page...');
        
        // Check if we're on the right page
        if (!window.location.href.includes('localhost:3000') && !window.location.href.includes('jobtracker')) {
            console.log('❌ You might not be on the JobTracker page');
            console.log('💡 Make sure you are on http://localhost:3000');
            return;
        }
        console.log('✅ On JobTracker page');
        
        console.log('\n2️⃣ Checking for React and authentication...');
        
        // Try to find authentication state through React
        let isSignedIn = false;
        let userInfo = null;
        
        // Check localStorage for any authentication data
        const keys = Object.keys(localStorage);
        console.log('🔍 LocalStorage keys:', keys);
        
        // Look for Firebase auth data in localStorage
        const authKeys = keys.filter(key => key.includes('firebase') || key.includes('auth'));
        if (authKeys.length > 0) {
            console.log('📱 Found Firebase auth keys:', authKeys);
            authKeys.forEach(key => {
                const value = localStorage.getItem(key);
                console.log(`   ${key}:`, value ? 'Has data' : 'Empty');
            });
        }
        
        console.log('\n3️⃣ Checking page elements...');
        
        // Look for sign-in/sign-out buttons or user info on the page
        const signInButton = document.querySelector('[data-testid="sign-in"]') || 
                           document.querySelector('button:contains("Sign In")') ||
                           document.querySelector('button:contains("Login")');
        
        const signOutButton = document.querySelector('[data-testid="sign-out"]') || 
                            document.querySelector('button:contains("Sign Out")') ||
                            document.querySelector('button:contains("Logout")');
        
        if (signOutButton) {
            console.log('✅ Found sign out button - likely signed in');
            isSignedIn = true;
        } else if (signInButton) {
            console.log('❌ Found sign in button - not signed in');
            console.log('💡 Please sign in to JobTracker first');
            return { status: 'not_signed_in' };
        }
        
        // Look for job-related elements on the page
        const jobElements = document.querySelectorAll('[data-testid*="job"]');
        const tableRows = document.querySelectorAll('tr');
        const cardElements = document.querySelectorAll('[class*="card"]');
        
        console.log('📊 Page elements found:');
        console.log(`   Job-related elements: ${jobElements.length}`);
        console.log(`   Table rows: ${tableRows.length}`);
        console.log(`   Card elements: ${cardElements.length}`);
        
        // Check for loading states
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
        if (loadingElements.length > 0) {
            console.log('⏳ Found loading elements - page might still be loading');
        }
        
        // Check for error messages
        const errorElements = document.querySelectorAll('[class*="error"], [role="alert"]');
        if (errorElements.length > 0) {
            console.log('❌ Found error elements on page:');
            errorElements.forEach(el => console.log(`   Error: ${el.textContent}`));
        }
        
        console.log('\n4️⃣ Checking browser console for errors...');
        
        // We can't directly access console errors, but we can suggest checking
        console.log('💡 Please check this console for any red error messages above this point');
        console.log('💡 Common errors to look for:');
        console.log('   - "Failed to load jobs"');
        console.log('   - "Permission denied"');
        console.log('   - "Firebase" or "Firestore" errors');
        console.log('   - Network request failures');
        
        console.log('\n📋 MANUAL VERIFICATION STEPS:');
        console.log('=============================');
        console.log('1. Are you signed in? Look for a sign-out button or user email on the page');
        console.log('2. Is the dev server running? You should see this URL working: http://localhost:3000');
        console.log('3. Check browser console (this window) for any red error messages');
        console.log('4. Try refreshing the page with Ctrl+F5 (hard refresh)');
        
        return { 
            status: 'manual_check_needed',
            isSignedIn,
            pageElements: {
                jobElements: jobElements.length,
                tableRows: tableRows.length,
                cards: cardElements.length,
                hasErrors: errorElements.length > 0
            }
        };
        
    } catch (error) {
        console.error('❌ Debug script failed:', error);
        return { status: 'script_error', error: error.message };
    }
}

// Quick add test job function (for when imports work)
async function tryAddTestJob() {
    console.log('\n🧪 ATTEMPTING TO ADD TEST JOB...');
    
    try {
        // This is a fallback that might work if the page has loaded Firebase
        if (typeof window !== 'undefined') {
            // Try to find Firebase on the window object
            const firebase = window.firebase;
            if (firebase) {
                console.log('✅ Found global Firebase object');
                
                const user = firebase.auth().currentUser;
                if (!user) {
                    console.log('❌ Not signed in');
                    return;
                }
                
                const db = firebase.firestore();
                const testJob = {
                    companyName: 'Test Company',
                    jobTitle: 'Test Position',
                    status: 'applied',
                    dateApplied: new Date().toISOString().split('T')[0],
                    userId: user.uid,
                    source: 'debug_script'
                };
                
                const docRef = await db.collection('jobApplications').add(testJob);
                console.log('✅ Test job created:', docRef.id);
                console.log('🔄 Refresh the page to see it');
                
                return { status: 'success', jobId: docRef.id };
            }
        }
        
        console.log('⚠️  Cannot add test job - Firebase not accessible from browser console');
        console.log('💡 This usually means the app is using modern ES modules');
        console.log('💡 Try manually adding a job through the JobTracker UI instead');
        
    } catch (error) {
        console.log('❌ Failed to add test job:', error.message);
    }
}

// Make functions available
window.simpleDebug = simpleDebug;
window.tryAddTestJob = tryAddTestJob;

console.log('🚀 Simple debug loaded!');
console.log('Commands:');
console.log('  await simpleDebug()     - Check page state and authentication');
console.log('  await tryAddTestJob()   - Try to add a test job (may not work)');
console.log('');
console.log('💡 Run: await simpleDebug()');

// Auto-run the simple debug
setTimeout(() => {
    console.log('\n🔄 Auto-running simple debug...');
    simpleDebug();
}, 1000);
