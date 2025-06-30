# STEP-BY-STEP TROUBLESHOOTING GUIDE
After updating Firestore rules, jobs still not showing? Follow these steps:

## STEP 1: Basic Checks
1. **Make sure you're signed in** to JobTracker
2. **Check your browser console** (F12) for any red error messages
3. **Verify your development server is running** (`npm run dev`)

## STEP 2: Quick Database Test
1. **Open browser console** (F12)
2. **Copy and paste** the entire content of `quick-debug.js` into the console
3. **Press Enter** to run it
4. **Read the results** - it will tell you exactly what's wrong

## STEP 3: Common Issues & Solutions

### Issue: "NOT SIGNED IN"
**Solution:** Sign in to JobTracker first, then repeat Step 2

### Issue: "Found 0 jobs for your account"
**Solution:** You have no jobs yet. Run `addTestJob()` in console to add one

### Issue: "PERMISSION DENIED"
**Solution:** Your Firestore rules aren't updated yet
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database → Rules
4. Copy the rules from `firestore.rules` file
5. Click "Publish"
6. Wait 1-2 minutes for rules to propagate

### Issue: "Database error" or import errors
**Solution:** 
1. Stop development server (Ctrl+C)
2. Run `npm install`
3. Run `npm run dev`
4. Refresh browser

## STEP 4: If Jobs Exist But Don't Show
1. **Hard refresh** your browser (Ctrl+F5 or Cmd+Shift+R)
2. **Clear browser cache** and try again
3. **Check console for React errors** (red error messages)

## STEP 5: Add Test Job Manually
If everything else works, add a test job:
1. Run `addTestJob()` in browser console
2. Refresh the page
3. You should see "Google - Software Engineer" job

## STEP 6: Verify Your Data Structure
Your jobs should be in Firestore like this:
```
jobApplications/
  ├── doc1: { companyName: "...", jobTitle: "...", userId: "your-user-id", ... }
  ├── doc2: { companyName: "...", jobTitle: "...", userId: "your-user-id", ... }
  └── ...
```

**NOT like this:**
```
users/
  └── your-user-id/
      └── jobs/
          ├── doc1: { ... }
          └── ...
```

## STEP 7: Still Not Working?
1. Share the **exact output** from the quick-debug script
2. Share any **error messages** from browser console
3. Confirm you've **published the Firestore rules** in Firebase Console

The quick-debug script will identify the exact problem in 30 seconds!
