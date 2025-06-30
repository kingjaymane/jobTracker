// Test file for email filtering improvements
// This file can be used to test the new filtering logic

// Mock email data for testing
const testEmails = [
  // Should be FILTERED OUT (job board notifications)
  {
    from: "notifications@linkedin.com",
    subject: "Jobs you may be interested in",
    body: "Here are some recommended jobs based on your profile...",
    expected: "FILTERED_OUT"
  },
  {
    from: "noreply@indeed.com", 
    subject: "Daily Job Digest",
    body: "New jobs matching your search criteria. Apply now to these positions...",
    expected: "FILTERED_OUT"
  },
  {
    from: "alerts@glassdoor.com",
    subject: "Job Alert: Software Engineer",
    body: "Jobs for you. View all jobs. Browse opportunities. Unsubscribe here.",
    expected: "FILTERED_OUT"
  },
  
  // Should be KEPT (legitimate job emails)
  {
    from: "john.smith@techcorp.com",
    subject: "Thank you for your application - Software Engineer",
    body: "Dear candidate, we have received your application for the Software Engineer position at TechCorp. We will review and get back to you soon.",
    expected: "KEPT",
    expectedCompany: "TechCorp", 
    expectedJobTitle: "Software Engineer"
  },
  {
    from: "Sarah Johnson <sarah@startup.io>",
    subject: "Interview Invitation - Full Stack Developer Role",
    body: "Hi, I'm Sarah from Startup Inc. We'd like to schedule an interview for the Full Stack Developer position you applied for.",
    expected: "KEPT",
    expectedCompany: "Startup Inc",
    expectedJobTitle: "Full Stack Developer"
  },
  {
    from: "hr@bigcompany.com",
    subject: "Application Confirmation",
    body: "Your application for Product Manager at BigCompany has been received. Our team will review your application.",
    expected: "KEPT",
    expectedCompany: "BigCompany",
    expectedJobTitle: "Product Manager"
  },
  
  // Edge cases
  {
    from: "recruiting-team@company.com",
    subject: "Exciting opportunities at Company",
    body: "We have multiple positions available. Check out these roles that might interest you...",
    expected: "FILTERED_OUT" // Generic recruiting email
  },
  {
    from: "jane.doe@personalcompany.com",
    subject: "Re: Senior Data Scientist Position",
    body: "Following up on your application for Senior Data Scientist. We'd like to move forward with an interview.",
    expected: "KEPT",
    expectedCompany: "Personalcompany",
    expectedJobTitle: "Senior Data Scientist"
  }
];

// Test function (for manual testing in browser console)
function testEmailFiltering() {
  console.log("Testing Email Filtering Improvements...\n");
  
  testEmails.forEach((email, index) => {
    console.log(`Test ${index + 1}: ${email.subject}`);
    console.log(`From: ${email.from}`);
    console.log(`Expected: ${email.expected}`);
    
    // Here you would call the actual filtering functions
    // For manual testing, you can copy these functions to browser console
    console.log("---");
  });
}

// Manual testing instructions:
console.log(`
EMAIL FILTERING TEST INSTRUCTIONS:
==================================

1. Open the browser console on your JobTracker app
2. Copy the filtering functions from app/api/email/scan/route.ts:
   - isJobBoardNotification()
   - isJobRelatedEmail() 
   - extractCompany()
   - extractJobTitle()

3. Copy this test data and run testEmailFiltering()

4. For each test email, manually call the functions:
   const content = (subject + " " + body).toLowerCase();
   const isFiltered = isJobBoardNotification(content, from, subject);
   const isJobRelated = isJobRelatedEmail(content, from, subject);
   const company = extractCompany(from, body, subject);
   const jobTitle = extractJobTitle(content, subject);

5. Verify the results match the expected outcomes

EXPECTED RESULTS:
================
- Job board notifications should be filtered out (isJobBoardNotification = true)
- Legitimate job emails should pass through (isJobRelated = true, isJobBoardNotification = false)
- Company names should be extracted accurately (no "Team", "HR", generic terms)
- Job titles should be properly formatted and relevant

COMMON ISSUES TO CHECK:
======================
- False positives: Generic recruiting emails being classified as job applications
- False negatives: Legitimate job emails being filtered out
- Company extraction: Generic terms instead of actual company names
- Job title extraction: Missing or incorrect job titles
`);

export { testEmails, testEmailFiltering };
