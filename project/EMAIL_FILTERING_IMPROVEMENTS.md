# Email Filtering Improvements

This document outlines the enhanced email filtering and company/recruiter name extraction improvements implemented in the job tracker application.

## Overview

The email scanning system has been significantly improved to:
1. **Filter out job board notification emails** that are not actual job applications
2. **Enhance company and recruiter name extraction** to identify real companies instead of generic terms
3. **Improve job title extraction** with more sophisticated pattern matching
4. **Refine confidence scoring** to reduce false positives

## Job Board Notification Filtering

### What Gets Filtered Out

The system now automatically filters out common job board notifications and promotional emails:

#### LinkedIn Notifications
- "jobs you may be interested in"
- "recommended for you"
- "new jobs posted"
- "job alert"
- "daily/weekly job digest"
- "premium job insights"

#### Indeed Notifications
- "jobs matching your search"
- "recommended jobs"
- "new jobs on indeed"
- "indeed job alert"
- "similar to jobs you"

#### Glassdoor Notifications
- "jobs for you"
- "personalized job recommendations"
- "glassdoor job alert"
- "companies hiring"

#### ZipRecruiter & Other Job Boards
- "ziprecruiter job alert"
- "jobs posted near"
- "apply to these jobs"
- "one-click apply"

#### Generic Promotional Content
- Newsletter emails
- Marketing emails
- Subscription updates
- Sponsored content
- "You might like" recommendations

### Detection Methods

The system uses multiple detection methods:

1. **Sender Pattern Analysis**: Identifies emails from automated senders
   - `noreply@`, `no-reply@`, `notifications@`
   - `alerts@`, `digest@`, `marketing@`

2. **Content Pattern Matching**: Scans email content for notification language
   - Promotional phrases like "explore opportunities"
   - Generic recommendations like "jobs you might like"
   - Marketing indicators like "unsubscribe"

3. **Automated Email Detection**: Identifies auto-generated content
   - "This is an automated message"
   - "Do not reply to this email"
   - "Automatically generated"

## Enhanced Company Name Extraction

### Improved Domain Filtering

Extended the list of excluded domains to filter out:
- **Email providers**: Gmail, Yahoo, Outlook, Hotmail, AOL, iCloud
- **Job sites**: LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, Dice
- **ATS systems**: Workday, Greenhouse, Lever, Jobvite, SmartRecruiters
- **Notification systems**: NoReply, Automated, Notifications

### Smart Company Name Detection

The system now uses multiple extraction methods:

1. **Domain-based extraction** with intelligent filtering
2. **Pattern-based extraction** from email content:
   - "From [Company Name]" patterns
   - "At [Company Name]" patterns
   - "We are [Company Name]" patterns
   - Company signature patterns

3. **Generic term filtering** to avoid false positives:
   - Filters out terms like "Team", "HR", "Recruiting"
   - Excludes system-generated names
   - Skips notification-related terms

4. **Personal name detection** to distinguish companies from individuals
   - Identifies "First Last" name patterns
   - Avoids treating personal names as companies

### Company Name Cleaning

- Removes common prefixes: `www.`, `mail.`, `hr.`, `jobs.`
- Removes corporate suffixes: `corp`, `inc`, `llc`, `ltd`
- Proper capitalization formatting
- Length validation (2-50 characters)

## Enhanced Job Title Extraction

### Expanded Pattern Matching

The system now recognizes more job title patterns:

1. **Direct position patterns**:
   - "for the Software Engineer position"
   - "as a Product Manager role"

2. **Application patterns**:
   - "applied for Data Scientist"
   - "application for Frontend Developer"

3. **Interest patterns**:
   - "interested in Backend Engineer"
   - "regarding the UX Designer position"

4. **Subject line patterns**:
   - "Application: Full Stack Developer"
   - "Re: Software Engineer Role"

5. **Common job titles with context**:
   - Specific titles like "Full Stack Developer"
   - Level-based titles like "Senior Software Engineer"

### Job Title Cleaning

- Removes non-alphanumeric characters
- Filters out generic terms that aren't job titles
- Validates length and content
- Proper case formatting

## Improved Confidence Scoring

### Dynamic Confidence Calculation

The confidence scoring system has been refined:

1. **Lower base confidence** (0.2) due to better pre-filtering
2. **Higher weight for quality company extraction** (0.4 vs 0.2)
3. **Subject line analysis** for application confirmations and interviews
4. **Personal email detection** for higher authenticity
5. **False positive reduction** for promotional content

### Confidence Factors

- **Company Quality**: Higher scores for non-generic company names
- **Job Title Accuracy**: Bonus for well-extracted job titles
- **Email Type**: Higher confidence for personal vs automated emails
- **Subject Line Indicators**: Application confirmations, interview requests
- **Content Quality**: Reduces score for promotional language

### Threshold Adjustment

- Lowered confidence threshold from 0.6 to 0.5
- Better filtering allows for lower threshold without false positives
- More legitimate job emails are now captured

## Testing the Improvements

### Before Scanning

1. Check that legitimate job application emails are not filtered out
2. Verify that job board notifications are properly excluded
3. Ensure company names are extracted accurately

### After Scanning

1. Review extracted company names for accuracy
2. Check that job titles are properly formatted
3. Verify confidence scores are reasonable
4. Confirm no false positives from job board notifications

## Common Edge Cases

### Handled Cases

1. **Recruiter emails from job sites**: Properly filtered vs legitimate recruiter outreach
2. **Company emails with generic domains**: Gmail/Yahoo emails from actual employees
3. **ATS system emails**: Application confirmations vs promotional content
4. **Mixed content emails**: Emails with both application content and promotional material

### Limitations

1. **Complex email signatures**: May miss some company names in elaborate signatures
2. **Non-English content**: Primarily optimized for English-language emails
3. **Heavily formatted emails**: HTML-heavy emails may have extraction issues

## Monitoring and Adjustment

### Recommended Monitoring

1. **False Positive Rate**: Track emails incorrectly classified as job applications
2. **False Negative Rate**: Monitor missed legitimate job emails
3. **Company Name Accuracy**: Review extracted company names for correctness
4. **Job Title Quality**: Assess job title extraction accuracy

### Future Improvements

1. **Machine Learning Integration**: Train models on user feedback
2. **Custom Filtering Rules**: Allow users to add custom filter patterns
3. **Multi-language Support**: Expand pattern matching for other languages
4. **Industry-specific Patterns**: Tailor extraction for different job sectors

## Configuration

### Environment Variables

No additional environment variables are required for the filtering improvements.

### Customization

The filtering patterns can be customized by modifying the arrays in:
- `app/api/email/scan/route.ts`
- `lib/email-analysis.ts`

### Performance Impact

The enhanced filtering adds minimal processing overhead while significantly improving accuracy.
