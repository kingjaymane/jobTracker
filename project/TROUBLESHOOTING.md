# Troubleshooting Guide

Common issues and solutions for JobTracker.

## 🔧 Gmail Integration Issues

### Problem: "Unexpected token '<', '<!DOCTYPE'... is not valid JSON" Error
**Symptoms**: Gmail connection fails with JSON parsing error

**Solutions**:
1. **Check Development Server**:
   ```bash
   # Make sure Next.js dev server is running
   npm run dev
   
   # Should see: "Ready - started server on 0.0.0.0:3000"
   ```

2. **Verify API Routes**:
   ```bash
   # Test the API endpoint directly
   # Navigate to: http://localhost:3000/api/test
   # Should return JSON, not HTML
   ```

3. **Check Environment Variables**:
   ```bash
   # Verify .env.local exists and has correct values
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Restart Development Server**:
   ```bash
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

### Problem: OAuth Callback Not Working
**Symptoms**: Popup closes but Gmail doesn't connect, or error in callback

**Solutions**:
1. **Check Redirect URI**:
   ```bash
   # Verify in Google Cloud Console
   # Must match exactly: http://localhost:3000/api/auth/gmail/callback
   ```

2. **Verify Environment Variables**:
   ```bash
   # Check .env.local
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Clear Browser Cache**:
   - Clear cookies for localhost:3000
   - Try incognito/private browsing
   - Disable browser extensions

4. **Check Console Logs**:
   ```javascript
   // Open browser dev tools
   // Check for CORS errors
   // Look for postMessage errors
   ```

### Problem: "Gmail API has not been used" Error
**Symptoms**: 403 error when scanning emails

**Solutions**:
1. **Enable Gmail API**:
   - Go to Google Cloud Console → APIs & Services → Library
   - Search "Gmail API" and enable it
   - Wait 5-10 minutes for propagation

2. **Check Billing**:
   - Gmail API requires billing enabled
   - Add payment method to Google Cloud project

### Problem: Email Scanning Returns No Results
**Symptoms**: Scan completes but finds 0 job emails

**Solutions**:
1. **Check Email Content**:
   - Ensure you have job-related emails in the last 30 days
   - Keywords: job, application, interview, position, etc.

2. **Verify Search Query**:
   ```javascript
   // Current search includes:
   job OR application OR interview OR offer OR position OR hiring OR recruiter
   ```

3. **Check Date Range**:
   - Only scans last 30 days by default
   - Older emails won't be found

### Problem: Infinite Loading on Email Scan
**Symptoms**: Scan button shows loading forever

**Solutions**:
1. **Check API Route**:
   ```bash
   # Open dev tools Network tab
   # Look for /api/email/scan request
   # Check for 500 errors
   ```

2. **Verify Credentials**:
   ```javascript
   // Check if token is expired
   // Try disconnecting and reconnecting Gmail
   ```

## 🔐 Authentication Issues

### Problem: Firebase Auth Not Working
**Symptoms**: Can't sign in, blank auth forms

**Solutions**:
1. **Check Firebase Config**:
   ```javascript
   // Verify all Firebase environment variables
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   // etc.
   ```

2. **Enable Authentication Providers**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password
   - Configure authorized domains

3. **Check Network Requests**:
   ```bash
   # Look for firebaseapp.com requests in Network tab
   # Check for CORS errors
   ```

### Problem: "Sign-in Redirect Loop"
**Symptoms**: Keeps redirecting to sign-in page

**Solutions**:
1. **Clear Local Storage**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Check Auth Context**:
   ```javascript
   // Verify AuthContext is properly wrapped around app
   // Check for initialization errors
   ```

## 📊 Data Issues

### Problem: Jobs Not Saving to Firestore
**Symptoms**: Add job but it doesn't appear in list

**Solutions**:
1. **Check Firestore Rules**:
   ```javascript
   // Rules must allow authenticated users to write
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/jobs/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Verify Collection Structure**:
   ```bash
   # Expected structure:
   users/{userId}/jobs/{jobId}
   ```

3. **Check Console Errors**:
   ```javascript
   // Look for permission denied errors
   // Check for network issues
   ```

### Problem: Jobs Not Loading
**Symptoms**: Empty job list despite having data

**Solutions**:
1. **Check User ID**:
   ```javascript
   // Verify user is authenticated
   // Check if userId matches Firestore structure
   ```

2. **Verify Firestore Connection**:
   ```bash
   # Check Firebase config
   # Test Firestore connection manually
   ```

## 🎨 UI/UX Issues

### Problem: Dark Mode Not Working
**Symptoms**: Theme doesn't change or saves incorrectly

**Solutions**:
1. **Check Theme Provider**:
   ```javascript
   // Verify ThemeProvider wraps the app
   // Check for suppressHydrationWarning
   ```

2. **Clear Theme Storage**:
   ```javascript
   localStorage.removeItem('theme');
   ```

### Problem: Mobile Layout Broken
**Symptoms**: Overlapping elements, horizontal scroll

**Solutions**:
1. **Check Responsive Classes**:
   ```css
   /* Verify Tailwind responsive utilities */
   grid-cols-1 md:grid-cols-2 lg:grid-cols-5
   ```

2. **Test on Real Devices**:
   - Chrome DevTools mobile simulation isn't always accurate
   - Test on actual phones/tablets

### Problem: Icons Not Loading
**Symptoms**: Missing or broken icons

**Solutions**:
1. **Check Lucide React Import**:
   ```javascript
   import { Mail } from 'lucide-react';
   ```

2. **Verify Package Installation**:
   ```bash
   npm install lucide-react
   ```

## ⚡ Performance Issues

### Problem: Slow Page Load
**Symptoms**: Long loading times, blank screens

**Solutions**:
1. **Check Bundle Size**:
   ```bash
   npm run build
   # Look for large chunks in output
   ```

2. **Optimize Imports**:
   ```javascript
   // Use specific imports instead of barrel imports
   import { Button } from '@/components/ui/button';
   ```

3. **Implement Code Splitting**:
   ```javascript
   const LazyComponent = dynamic(() => import('./Component'));
   ```

### Problem: High Firestore Costs
**Symptoms**: Unexpected Firebase billing

**Solutions**:
1. **Check Read/Write Patterns**:
   ```javascript
   // Avoid unnecessary re-renders
   // Use React.memo for expensive components
   ```

2. **Implement Pagination**:
   ```javascript
   // Don't load all jobs at once
   // Use Firestore query limits
   ```

## 📧 Email Filtering Issues

### Problem: Legitimate Job Emails Being Filtered Out
**Symptoms**: Real job application emails are not appearing in scan results

**Solutions**:
1. **Check Email Content**:
   - Ensure the email contains job-related keywords: job, application, position, interview, hiring
   - Verify it's not from a promotional/notification sender (noreply@, alerts@)

2. **Review Confidence Scoring**:
   - Check if company name is properly extracted (not generic terms like "Team")
   - Verify job title is identifiable in the content
   - Ensure email is from a legitimate sender

3. **Manual Review**:
   ```javascript
   // Check the email scanning logs in browser console
   // Look for confidence scores and filtering reasons
   ```

### Problem: Job Board Notifications Still Getting Through
**Symptoms**: Promotional emails from job sites are being imported as job applications

**Solutions**:
1. **Verify Sender Patterns**:
   - Check if sender includes: noreply, notifications, alerts, digest
   - Look for automated/marketing language in content

2. **Check Content Patterns**:
   - Look for phrases like "jobs you may like", "recommended for you"
   - Marketing language: "unsubscribe", "promotional", "newsletter"

3. **Report Pattern**:
   ```bash
   # If a specific pattern keeps getting through, it can be added to the filter list
   # Check the email content and subject for common patterns
   ```

### Problem: Company Names Showing as "Unknown Company"
**Symptoms**: Emails are detected but company name is not extracted

**Solutions**:
1. **Check Email Domain**:
   - Verify domain is not in excluded list (gmail, yahoo, job sites)
   - Look for company domain in "From" header

2. **Review Email Content**:
   - Check for company name in email signature
   - Look for "From [Company]" or "At [Company]" patterns
   - Verify name is not a generic term (Team, HR, Recruiting)

3. **Manual Company Entry**:
   - You can manually edit the job after import to correct company name
   - Use the Edit Job modal to update extracted information

### Problem: Job Titles Showing as "Unknown Position"
**Symptoms**: Job titles are not being extracted from emails

**Solutions**:
1. **Check Email Content**:
   - Look for job title in subject line or email body
   - Verify title follows recognizable patterns (Software Engineer, Product Manager)
   - Check for application/position context around title

2. **Review Title Patterns**:
   ```text
   Common patterns that should work:
   - "Application for Software Engineer"
   - "Thank you for applying for the Product Manager role"
   - "Interview for Senior Developer position"
   ```

3. **Manual Title Entry**:
   - Edit the job after import to add the correct title
   - The system learns from manual corrections

### Problem: High Confidence Score but Wrong Information
**Symptoms**: System is confident but extracted wrong company/title

**Solutions**:
1. **Review Extraction Logic**:
   - Check if email has misleading patterns
   - Look for false positive indicators

2. **Adjust Manually**:
   - Use Edit Job modal to correct information
   - Delete and re-add if necessary

3. **Report Issue**:
   - Note the email pattern for potential filter improvement
   - Check console logs for extraction details

## 🔍 Debugging Tips

### Enable Debug Mode
```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG=true
```

### Browser Dev Tools
1. **Console Tab**: JavaScript errors and logs
2. **Network Tab**: API requests and responses
3. **Application Tab**: Local storage, cookies, service workers
4. **Sources Tab**: Breakpoints and code inspection

### Common Console Commands
```javascript
// Check current user
console.log(firebase.auth().currentUser);

// Check local storage
console.log(localStorage);

// Check environment variables
console.log(process.env);
```

### API Testing
```bash
# Test email auth endpoint
curl -X POST http://localhost:3000/api/email/auth

# Test email scan endpoint
curl -X POST http://localhost:3000/api/email/scan \
  -H "Content-Type: application/json" \
  -d '{"credentials": {...}}'
```

## 📞 Getting Help

### Before Reporting Issues
1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Test in incognito mode
4. Try on different browsers/devices
5. Check for recent changes to your code

### When Reporting Issues
Include:
1. **Environment**: OS, browser, Node.js version
2. **Steps to reproduce**: Exact sequence of actions
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Console errors**: Copy full error messages
6. **Screenshots**: If UI-related

### Useful Information to Collect
```bash
# System info
node --version
npm --version

# Package versions
npm list next react firebase

# Environment check
echo $NEXT_PUBLIC_BASE_URL
```

## 🔄 Reset Procedures

### Complete Reset
```bash
# 1. Clear all local data
localStorage.clear();
sessionStorage.clear();

# 2. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 3. Reset environment
cp .env.example .env.local
# Fill in fresh values

# 4. Clear Next.js cache
rm -rf .next

# 5. Restart development server
npm run dev
```

### Partial Resets
```javascript
// Clear just auth data
localStorage.removeItem('firebase:authUser');

// Clear just theme
localStorage.removeItem('theme');

// Clear just email integration
localStorage.removeItem('emailIntegration');
```

### Problem: Need to Clean Up Old Job Board Imports
**Symptoms**: Database contains job applications from promotional emails that shouldn't be there

**Solutions**:
1. **Use the Job Cleanup Tool**:
   - Go to Settings → Job Import Cleanup Tool
   - Click "Analyze Job Imports" to scan your existing data
   - Review the jobs marked for cleanup
   - Click "Clean Up" to remove problematic imports

2. **Manual Review**:
   - Check the "Suspicious Jobs" section for jobs that need manual review
   - Edit or delete individual jobs as needed
   - Look for jobs with generic company names like "Team", "HR", "Notification"

3. **Prevention**:
   - The improved filtering will prevent future job board notifications from being imported
   - Existing good job imports will be preserved

### Problem: "Failed to analyze jobs" Error in Cleanup Tool
**Symptoms**: Cleanup tool shows "Failed to analyze jobs" when trying to analyze

**Solutions**:
1. **Test API Connection**:
   - In the Job Cleanup Tool, click "Test API" button first
   - Check the diagnostics output for any errors
   - Verify the API is responding correctly

2. **Check Authentication**:
   ```javascript
   // Verify user is authenticated
   console.log('Current user:', firebase.auth().currentUser);
   ```

3. **Database Connection Issues**:
   ```bash
   # Check if Firestore is properly configured
   # Verify .env.local has correct Firebase settings
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   ```

4. **Check Browser Console**:
   ```javascript
   // Open dev tools and look for errors
   // Check Network tab for failed API requests
   // Look for 400/500 status codes
   ```

5. **Firestore Permissions**:
   ```javascript
   // Ensure Firestore rules allow reading user's jobs
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/jobs/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

6. **API Route Issues**:
   ```bash
   # Test the cleanup API directly
   curl -X GET http://localhost:3000/api/jobs/cleanup
   # Should return success: true
   ```

7. **No Jobs Found**:
   - If you have no jobs in your database, the tool will show "No jobs found to analyze"
   - Add some test jobs first, then try the cleanup tool
   - The tool only analyzes existing email imports

### Problem: "Analysis failed: Database connection failed - Missing or insufficient permissions"
**Symptoms**: Cleanup tool fails with "Missing or insufficient permissions" error

**Root Cause**: Firestore security rules are blocking access to your job data

**Solutions**:
1. **Update Firestore Security Rules** (Most Important):
   ```javascript
   // Go to Firebase Console → Firestore Database → Rules
   // Replace existing rules with:
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow users to read/write their own job data
       match /users/{userId}/jobs/{jobId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Allow users to read/write their own user profile
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Allow reading/writing subcollections under user document
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Verify Authentication in Browser**:
   ```javascript
   // Open browser console and check:
   firebase.auth().currentUser
   // Should show user object, not null
   ```

3. **Check Firebase Configuration**:
   ```bash
   # Verify all required Firebase environment variables in .env.local:
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Test Database Access**:
   ```javascript
   // In browser console, test if you can read your data:
   import { collection, getDocs } from 'firebase/firestore';
   import { db } from './lib/firebase';
   
   // Test reading jobs (replace 'your-user-id' with actual user ID)
   const jobsRef = collection(db, 'users', 'your-user-id', 'jobs');
   getDocs(jobsRef).then(snapshot => {
     console.log('Jobs found:', snapshot.docs.length);
   }).catch(error => {
     console.error('Database error:', error);
   });
   ```

5. **Alternative: Temporarily Open Rules for Testing** (Not recommended for production):
   ```javascript
   // TEMPORARY ONLY - for testing purposes
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;  // WARNING: This allows anyone to access your data!
       }
     }
   }
   // Remember to change back to secure rules after testing
   ```

6. **Step-by-Step Fix Process**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click "Firestore Database" in left sidebar
   - Click "Rules" tab
   - Replace the rules with the secure version above
   - Click "Publish"
   - Wait 1-2 minutes for rules to propagate
   - Try the cleanup tool again

### Problem: Jobs Not Loading / Empty Dashboard - IMMEDIATE STEPS
**Symptoms**: Dashboard shows no jobs despite having data, or "failed to load jobs" errors

**STATUS: REVERTED TO STABLE VERSION**
The database collection structure has been reverted to the original working version to ensure compatibility with existing data.

**QUICK DIAGNOSIS - Follow these steps in order:**

#### Step 1: Update Your Firestore Security Rules
This is the most important step. Go to [Firebase Console](https://console.firebase.google.com):
1. Select your project
2. Click "Firestore Database" in left sidebar  
3. Click "Rules" tab
4. Replace existing rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobApplications/{jobId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
5. Click "Publish"
6. Wait 1-2 minutes for rules to propagate

#### Step 2: Check if Development Server is Running
```bash
# In your terminal, make sure this is running:
npm run dev
# You should see: "Ready - started server on 0.0.0.0:3000"
```

#### Step 3: Check Authentication
1. Open JobTracker in browser: http://localhost:3000
2. Make sure you're signed in
3. Open browser console (F12) 
4. Check authentication:
   ```javascript
   firebase.auth().currentUser
   // Should show user object with uid, email, etc.
   // If null, sign in first
   ```

#### Step 4: Test Database Access Directly
Copy and paste this in browser console:
```javascript
// Quick test of database access
async function testDB() {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log('❌ Not signed in');
    return;
  }
  
  try {
    const { getJobApplications } = await import('./lib/firestore');
    const jobs = await getJobApplications(user.uid);
    console.log('✅ Database test successful - found', jobs.length, 'jobs');
    return jobs;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return error;
  }
}

await testDB();
```

#### Step 5: Expected Results
After completing the steps above, you should see:
- ✅ Jobs loading correctly in dashboard
- ✅ No permission errors in browser console  
- ✅ Ability to add, edit, and delete jobs
- ✅ Email scanning and auto-import working correctly

#### If Issues Persist:
1. **Hard refresh** your browser (Ctrl+F5 or Cmd+Shift+R)
2. **Clear browser cache** and local storage
3. **Restart development server**: Stop (Ctrl+C) and run `npm run dev` again
4. **Check console errors** for specific error messages

### Problem: Jobs Not Loading / Empty Dashboard
**Symptoms**: Dashboard shows no jobs despite having data, or "failed to load jobs" errors

**Root Cause**: Database collection structure mismatch between code and security rules

**FIXED IN LATEST VERSION**: This issue has been resolved by updating the code to use the correct collection structure.

**What was changed**:
- ❌ **OLD (Broken)**: Jobs stored in `jobApplications` collection with `userId` field
- ✅ **NEW (Fixed)**: Jobs stored in `users/{userId}/jobs` collection structure

**Solutions**:
1. **If you have existing job data** that's not showing up:
   - Your old data may still be in the `jobApplications` collection
   - Use the migration script to move data to the new structure
   - Open browser console and run the migration script (see migration-script.js)

2. **For new installations**:
   - No action needed - the fix is automatic
   - New jobs will be saved to the correct collection structure

3. **Test the fix**:
   ```javascript
   // In browser console, verify the fix is working:
   const user = firebase.auth().currentUser;
   if (user) {
     console.log('Testing job fetch for user:', user.uid);
     // Jobs should now load correctly
   }
   ```

4. **Data Migration Process** (if you have existing data):
   ```javascript
   // Step 1: Open JobTracker in browser
   // Step 2: Sign in to your account  
   // Step 3: Open browser console (F12)
   // Step 4: Copy and paste the migration script (migration-script.js)
   // Step 5: Run: await migrateJobData()
   // Step 6: Refresh the page to see migrated data
   ```

**Verification**: After the fix, you should see:
- ✅ Jobs loading correctly in dashboard
- ✅ No permission errors in browser console
- ✅ Ability to add, edit, and delete jobs
- ✅ Email scanning and auto-import working correctly
   ```bash
   # Verify all required Firebase environment variables in .env.local:
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Test Database Access**:
   ```javascript
   // In browser console, test if you can read your data:
   import { collection, getDocs } from 'firebase/firestore';
   import { db } from './lib/firebase';
   
   // Test reading jobs (replace 'your-user-id' with actual user ID)
   const jobsRef = collection(db, 'users', 'your-user-id', 'jobs');
   getDocs(jobsRef).then(snapshot => {
     console.log('Jobs found:', snapshot.docs.length);
   }).catch(error => {
     console.error('Database error:', error);
   });
   ```

5. **Alternative: Temporarily Open Rules for Testing** (Not recommended for production):
   ```javascript
   // TEMPORARY ONLY - for testing purposes
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;  // WARNING: This allows anyone to access your data!
       }
     }
   }
   // Remember to change back to secure rules after testing
   ```

6. **Step-by-Step Fix Process**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click "Firestore Database" in left sidebar
   - Click "Rules" tab
   - Replace the rules with the secure version above
   - Click "Publish"
   - Wait 1-2 minutes for rules to propagate
   - Try the cleanup tool again

---

**Still having issues? Feel free to open a GitHub issue with detailed information! 🤝**
