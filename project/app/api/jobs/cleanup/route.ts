import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface JobData {
  id: string;
  company?: string;
  position?: string;
  emailFrom?: string;
  emailSubject?: string;
  emailThreadId?: string;
  dateApplied?: string;
  status?: string;
  [key: string]: any;
}

// Enhanced detection for job board notifications that should be cleaned up
function isJobBoardNotificationImport(job: JobData): boolean {
  if (!job.emailFrom && !job.emailSubject) {
    return false; // Not an email import
  }

  const from = (job.emailFrom || '').toLowerCase();
  const subject = (job.emailSubject || '').toLowerCase();
  const company = (job.company || '').toLowerCase();

  // Job board notification sender patterns
  const notificationSenders = [
    'noreply@linkedin.com',
    'jobs-noreply@linkedin.com',
    'notifications@linkedin.com',
    'noreply@indeed.com',
    'notifications@indeed.com',
    'noreply@glassdoor.com',
    'alerts@glassdoor.com',
    'noreply@ziprecruiter.com',
    'notifications@ziprecruiter.com',
    'noreply@monster.com',
    'jobs@dice.com',
    'noreply@dice.com',
    'notifications@angel.co',
    'noreply@wellfound.com',
    'jobs@stackoverflow.com',
    'noreply@github.com',
    'digest@',
    'alerts@',
    'notifications@',
    'marketing@',
    'automated@'
  ];

  // Check if from a notification sender
  const isNotificationSender = notificationSenders.some(sender => 
    from.includes(sender) || from.includes(sender.split('@')[0])
  );

  // Job board notification subject patterns
  const notificationSubjects = [
    'jobs you may be interested in',
    'recommended for you',
    'new jobs posted',
    'job alert',
    'daily job digest',
    'weekly job digest',
    'jobs matching your preferences',
    'similar jobs to ones you',
    'jobs like',
    'jobs near you',
    'trending jobs',
    'premium job insights',
    'jobs matching your search',
    'recommended jobs',
    'jobs from your search',
    'new jobs on indeed',
    'indeed job alert',
    'jobs for you',
    'personalized job recommendations',
    'glassdoor job alert',
    'companies hiring',
    'ziprecruiter job alert',
    'jobs posted near',
    'apply to these jobs',
    'one-click apply',
    'easy apply',
    'quick apply',
    'newsletter',
    'weekly update',
    'digest',
    'subscription',
    'marketing',
    'promotional',
    'sponsored',
    'advertisement',
    'ad:',
    'jobs you might like',
    'might interest you',
    'explore opportunities',
    'browse jobs',
    'view all jobs',
    'see more jobs',
    'apply now to',
    'check out these',
    'take a look at'
  ];

  // Check subject patterns
  const hasNotificationSubject = notificationSubjects.some(pattern => 
    subject.includes(pattern)
  );

  // Check for generic company names that indicate job board imports
  const genericCompanyNames = [
    'unknown company',
    'notification',
    'team',
    'hr',
    'recruiting',
    'jobs',
    'careers',
    'linkedin',
    'indeed',
    'glassdoor',
    'ziprecruiter',
    'monster',
    'dice',
    'stackoverflow',
    'github',
    'angel',
    'wellfound'
  ];

  const hasGenericCompany = genericCompanyNames.some(generic => 
    company.includes(generic)
  );

  // Check for automated email indicators
  const automatedIndicators = [
    'do not reply',
    'this is an automated',
    'automatically generated',
    'unsubscribe',
    'opt out',
    'manage preferences'
  ];

  const hasAutomatedIndicators = automatedIndicators.some(indicator => 
    subject.includes(indicator) || from.includes(indicator)
  );

  return isNotificationSender || hasNotificationSubject || hasGenericCompany || hasAutomatedIndicators;
}

// Function to identify potentially problematic imports
function scoreJobImportQuality(job: JobData): number {
  let score = 5; // Start with neutral score (1-10 scale)

  // Positive indicators (increase score)
  if (job.company && job.company !== 'Unknown Company' && job.company.length > 2) {
    score += 2;
  }

  if (job.position && job.position !== 'Unknown Position' && job.position.length > 3) {
    score += 2;
  }

  if (job.emailFrom && !job.emailFrom.includes('noreply') && !job.emailFrom.includes('no-reply')) {
    score += 1;
  }

  // Negative indicators (decrease score)
  if (isJobBoardNotificationImport(job)) {
    score -= 5;
  }

  if (job.company && ['Team', 'HR', 'Recruiting', 'Notification'].includes(job.company)) {
    score -= 3;
  }

  if (job.emailSubject && job.emailSubject.toLowerCase().includes('unsubscribe')) {
    score -= 3;
  }

  return Math.max(0, Math.min(10, score));
}

export async function POST(request: NextRequest) {
  console.log('Job cleanup API called');
  
  try {
    const body = await request.json();
    console.log('Request body received:', { mode: body.mode, hasUserId: !!body.userId });
    
    const { userId, mode = 'analyze' } = body;

    if (!userId) {
      console.log('Error: No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Starting job cleanup analysis for user: ${userId}, mode: ${mode}`);

    // Test database connection and get jobs
    let allJobs: JobData[] = [];
    try {
      const jobsRef = collection(db, 'users', userId, 'jobs');
      console.log('Database collection reference created successfully');
      
      const jobsSnapshot = await getDocs(jobsRef);
      console.log(`Database query completed. Found ${jobsSnapshot.docs.length} documents`);
      
      if (jobsSnapshot.empty) {
        console.log('No jobs found for user');
        return NextResponse.json({
          success: true,
          analysis: {
            totalJobs: 0,
            emailImports: 0,
            toCleanup: 0,
            suspicious: 0,
            good: 0
          },
          jobsToCleanup: [],
          suspiciousJobs: [],
          message: 'No jobs found to analyze'
        });
      }

      allJobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    console.log(`Found ${allJobs.length} total jobs`);

    // Filter to only email imports
    const emailImports = allJobs.filter(job => 
      job.emailFrom || job.emailSubject || job.emailThreadId
    );

    console.log(`Found ${emailImports.length} email imports`);

    // Analyze each email import
    const analysisResults = emailImports.map(job => {
      const quality = scoreJobImportQuality(job);
      const shouldCleanup = isJobBoardNotificationImport(job);
      
      return {
        id: job.id,
        company: job.company,
        position: job.position,
        emailFrom: job.emailFrom,
        emailSubject: job.emailSubject,
        dateApplied: job.dateApplied,
        quality,
        shouldCleanup,
        reasons: []
      };
    });

    // Identify jobs that should be cleaned up
    const jobsToCleanup = analysisResults.filter(job => job.shouldCleanup || job.quality < 3);
    const suspiciousJobs = analysisResults.filter(job => job.quality >= 3 && job.quality < 6);
    const goodJobs = analysisResults.filter(job => job.quality >= 6);

    console.log(`Jobs to cleanup: ${jobsToCleanup.length}`);
    console.log(`Suspicious jobs: ${suspiciousJobs.length}`);
    console.log(`Good jobs: ${goodJobs.length}`);

    if (mode === 'cleanup') {
      // Actually delete the problematic jobs
      const deletePromises = jobsToCleanup.map(async (job) => {
        const jobDocRef = doc(db, 'users', userId, 'jobs', job.id);
        await deleteDoc(jobDocRef);
        console.log(`Deleted job: ${job.id} - ${job.company} - ${job.position}`);
      });

      await Promise.all(deletePromises);

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${jobsToCleanup.length} problematic job imports`,
        deleted: jobsToCleanup.length,
        suspicious: suspiciousJobs.length,
        retained: goodJobs.length,
        totalAnalyzed: emailImports.length
      });
    } else {
      // Analysis mode - just return the results
      return NextResponse.json({
        success: true,
        analysis: {
          totalJobs: allJobs.length,
          emailImports: emailImports.length,
          toCleanup: jobsToCleanup.length,
          suspicious: suspiciousJobs.length,
          good: goodJobs.length
        },
        jobsToCleanup: jobsToCleanup.map(job => ({
          id: job.id,
          company: job.company,
          position: job.position,
          emailFrom: job.emailFrom,
          emailSubject: job.emailSubject,
          quality: job.quality
        })),
        suspiciousJobs: suspiciousJobs.map(job => ({
          id: job.id,
          company: job.company,
          position: job.position,
          emailFrom: job.emailFrom,
          emailSubject: job.emailSubject,
          quality: job.quality
        }))
      });
    }

  } catch (error) {
    console.error('Error in job cleanup:', error);
    return NextResponse.json({ 
      error: 'Failed to cleanup jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    console.log('Testing cleanup API...');
    
    // Basic health check
    return NextResponse.json({
      success: true,
      message: 'Job cleanup API is available',
      timestamp: new Date().toISOString(),
      endpoints: {
        analyze: 'POST with { userId, mode: "analyze" }',
        cleanup: 'POST with { userId, mode: "cleanup" }'
      },
      environment: {
        hasFirebase: !!db,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
