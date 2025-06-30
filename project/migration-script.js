// Data Migration Script for JobTracker
// This script helps migrate existing job data from the old collection structure
// to the new collection structure that matches the Firestore security rules.

// OLD STRUCTURE: jobApplications (with userId field)
// NEW STRUCTURE: users/{userId}/jobs

// INSTRUCTIONS:
// 1. This is a browser-based script (not Node.js)
// 2. Open your JobTracker app in the browser
// 3. Open browser console (F12)
// 4. Copy and paste this entire script
// 5. Run: await migrateJobData()

console.log('📦 JobTracker Data Migration Utility');
console.log('====================================');

async function migrateJobData() {
    try {
        console.log('🔍 Checking for existing data to migrate...');
        
        // Import necessary Firebase functions
        const { collection, getDocs, addDoc, deleteDoc, doc } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        const { useAuth } = await import('./contexts/AuthContext');
        
        // Get current user
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('❌ No authenticated user found. Please sign in first.');
            return;
        }
        
        console.log('✅ User authenticated:', currentUser.uid);
        
        // Check old collection for user's data
        console.log('📊 Checking old "jobApplications" collection...');
        const oldCollectionRef = collection(db, 'jobApplications');
        const oldSnapshot = await getDocs(oldCollectionRef);
        
        let userJobs = [];
        oldSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.userId === currentUser.uid) {
                userJobs.push({ id: doc.id, ...data });
            }
        });
        
        console.log(`📋 Found ${userJobs.length} jobs in old collection for current user`);
        
        if (userJobs.length === 0) {
            console.log('✅ No migration needed - no old data found');
            return;
        }
        
        // Check new collection structure
        console.log('📊 Checking new "users/{userId}/jobs" collection...');
        const newCollectionRef = collection(db, 'users', currentUser.uid, 'jobs');
        const newSnapshot = await getDocs(newCollectionRef);
        const existingNewJobs = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`📋 Found ${existingNewJobs.length} jobs in new collection structure`);
        
        // Migrate data
        console.log('🚀 Starting migration...');
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const job of userJobs) {
            try {
                // Check if this job already exists in new structure
                // (by comparing company name, job title, and date applied)
                const duplicate = existingNewJobs.find(existingJob => 
                    existingJob.companyName === job.companyName &&
                    existingJob.jobTitle === job.jobTitle &&
                    existingJob.dateApplied === job.dateApplied
                );
                
                if (duplicate) {
                    console.log(`⏭️  Skipping duplicate: ${job.companyName} - ${job.jobTitle}`);
                    skippedCount++;
                    continue;
                }
                
                // Create job in new structure (remove userId field as it's now implicit in path)
                const { userId, ...jobDataWithoutUserId } = job;
                
                await addDoc(newCollectionRef, {
                    ...jobDataWithoutUserId,
                    migratedAt: new Date().toISOString(),
                    migrationNote: 'Migrated from old collection structure'
                });
                
                console.log(`✅ Migrated: ${job.companyName} - ${job.jobTitle}`);
                migratedCount++;
                
            } catch (error) {
                console.error(`❌ Failed to migrate job: ${job.companyName} - ${job.jobTitle}`, error);
            }
        }
        
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Successfully migrated: ${migratedCount} jobs`);
        console.log(`   ⏭️  Skipped (duplicates): ${skippedCount} jobs`);
        console.log(`   📋 Total jobs found: ${userJobs.length} jobs`);
        
        if (migratedCount > 0) {
            console.log('');
            console.log('🎉 Migration completed successfully!');
            console.log('💡 Your jobs should now appear in the dashboard.');
            console.log('🔄 Refresh the page to see the migrated data.');
            console.log('');
            console.log('🗑️  CLEANUP (Optional):');
            console.log('After verifying that all data migrated correctly,');
            console.log('you can clean up the old data by running: await cleanupOldData()');
        } else {
            console.log('ℹ️  No new data was migrated.');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('💡 Make sure you are on the JobTracker website and signed in.');
    }
}

async function cleanupOldData() {
    try {
        console.log('🗑️  Starting cleanup of old data...');
        
        const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('❌ No authenticated user found.');
            return;
        }
        
        const oldCollectionRef = collection(db, 'jobApplications');
        const oldSnapshot = await getDocs(oldCollectionRef);
        
        let deletedCount = 0;
        
        for (const jobDoc of oldSnapshot.docs) {
            const data = jobDoc.data();
            if (data.userId === currentUser.uid) {
                await deleteDoc(doc(db, 'jobApplications', jobDoc.id));
                console.log(`🗑️  Deleted: ${data.companyName} - ${data.jobTitle}`);
                deletedCount++;
            }
        }
        
        console.log(`✅ Cleanup completed. Deleted ${deletedCount} old records.`);
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

// Make functions available globally
window.migrateJobData = migrateJobData;
window.cleanupOldData = cleanupOldData;

console.log('🚀 Migration utility loaded!');
console.log('📝 Usage:');
console.log('  await migrateJobData()     - Migrate data from old to new structure');
console.log('  await cleanupOldData()     - Clean up old data (run after migration)');
console.log('');
console.log('⚠️  IMPORTANT: Run migrateJobData() first, verify your data, then cleanupOldData()');
