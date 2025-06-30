# Job Cleanup Tool Usage Guide

This guide explains how to use the Job Cleanup Tool to remove incorrectly imported job board notification emails from your database.

## Overview

The Job Cleanup Tool identifies and removes job applications that were incorrectly imported from job board notifications (like LinkedIn job alerts, Indeed digests, etc.) before the improved filtering was implemented.

## How to Use

### Step 1: Access the Cleanup Tool
1. Navigate to your JobTracker dashboard
2. Click on "Settings" in the sidebar
3. Find the "Job Import Cleanup Tool" section

### Step 2: Analyze Your Data
1. Click the "Analyze Job Imports" button
2. The tool will scan all your job applications and categorize them:
   - **Total Jobs**: All jobs in your database
   - **Email Imports**: Jobs that were imported from emails
   - **To Clean Up**: Jobs identified as job board notifications (will be deleted)
   - **Suspicious**: Jobs with moderate quality scores (review manually)
   - **Good Imports**: Legitimate job applications (will be kept)

### Step 3: Review Results
- **Jobs to Clean Up**: These are job board notifications and promotional emails that should be removed
- **Suspicious Jobs**: Review these manually - they might be legitimate but have lower confidence scores

### Step 4: Execute Cleanup
1. Review the list of jobs that will be deleted
2. Click "Clean Up X Jobs" to remove the problematic imports
3. The tool will delete the identified job board notifications
4. Your legitimate job applications will remain untouched

## What Gets Cleaned Up

The tool identifies and removes:

### Job Board Notifications
- LinkedIn job recommendations and alerts
- Indeed daily/weekly job digests
- Glassdoor job notifications
- ZipRecruiter promotional emails
- Monster job alerts
- Generic "jobs you may like" emails

### Automated Emails
- No-reply automated messages
- Marketing and promotional content
- Newsletter subscriptions
- System-generated notifications

### Poor Quality Imports
- Jobs with generic company names like "Team", "HR", "Notification"
- Emails with no identifiable company or job title
- Content that includes "unsubscribe" or marketing language

## What Gets Preserved

The tool keeps legitimate job applications:

- Personal emails from recruiters or hiring managers
- Application confirmations from real companies
- Interview invitations and scheduling emails
- Offer letters and job-related correspondence
- Follow-up emails about applications

## Quality Scoring

Each job import is scored on a scale of 1-10:

- **0-2**: Poor quality, will be deleted
- **3-5**: Suspicious, requires manual review
- **6-10**: Good quality, will be preserved

Quality factors include:
- Company name specificity
- Job title clarity
- Email sender authenticity
- Content relevance
- Absence of promotional language

## Safety Features

- **Analysis Mode**: Always analyze before cleanup to review what will be deleted
- **Manual Review**: Suspicious jobs are flagged for manual review rather than automatic deletion
- **Detailed Reporting**: See exactly what was cleaned up and why
- **Reversible**: You can always re-import emails if needed

## Best Practices

1. **Run Analysis First**: Always analyze before cleaning up to see what will be affected
2. **Review Suspicious Jobs**: Manually check jobs with moderate scores
3. **Backup Important Data**: Consider exporting your job data before cleanup
4. **Regular Maintenance**: Run cleanup periodically if you had the old filtering enabled

## Example Results

A typical cleanup might show:

```
Total Jobs: 150
Email Imports: 87
To Clean Up: 23 (job board notifications)
Suspicious: 12 (review manually)
Good Imports: 52 (legitimate applications)
```

After cleanup:
- 23 job board notifications removed
- 127 legitimate jobs preserved
- Database is cleaner and more accurate

## Troubleshooting

### If Legitimate Jobs Are Marked for Cleanup
- Check if the email sender looks automated (noreply@, notifications@)
- Verify the company name isn't generic ("Team", "HR")
- Look for promotional language in the subject line
- You can manually edit the job after cleanup if needed

### If Job Board Notifications Aren't Detected
- Some edge cases might slip through
- You can manually delete these jobs
- Report patterns to improve future filtering

### If You Need to Restore Deleted Jobs
- Re-run the email scan after cleanup
- The improved filtering will only import legitimate jobs
- Manually add any jobs that were incorrectly removed

## Post-Cleanup

After running the cleanup:

1. **Verify Results**: Check that your job list looks cleaner
2. **Update Filters**: Use the filter bar to verify no promotional jobs remain
3. **Future Prevention**: The improved filtering prevents new false positives
4. **Regular Scans**: Email scanning will now be much more accurate

The cleanup tool is a one-time utility to fix historical data. Going forward, the improved email filtering will prevent job board notifications from being imported as job applications.
