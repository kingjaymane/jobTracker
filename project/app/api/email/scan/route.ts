import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Enhanced email analysis functions with job board filtering
function isJobBoardNotification(content: string, from: string, subject: string): boolean {
  // Job board notification patterns to filter out
  const notificationPatterns = [
    // LinkedIn notifications
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
    
    // Indeed notifications
    'jobs matching your search',
    'recommended jobs',
    'jobs from your search',
    'new jobs on indeed',
    'indeed job alert',
    'similar to jobs you',
    'jobs posted today',
    'more jobs like',
    
    // Glassdoor notifications
    'jobs for you',
    'personalized job recommendations',
    'glassdoor job alert',
    'companies hiring',
    'salary insights',
    
    // ZipRecruiter notifications
    'ziprecruiter job alert',
    'jobs posted near',
    'apply to these jobs',
    'one-click apply',
    
    // Generic notification patterns
    'newsletter',
    'weekly update',
    'digest',
    'subscription',
    'unsubscribe',
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
    'quick apply',
    'easy apply'
  ];

  const senderPatterns = [
    'noreply',
    'no-reply',
    'donotreply',
    'notifications@',
    'alerts@',
    'digest@',
    'newsletter@',
    'updates@',
    'marketing@',
    'jobs@indeed',
    'jobs@linkedin',
    'alerts@glassdoor',
    'notification@',
    'automated@'
  ];

  const contentLower = content.toLowerCase();
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // Check if it's from a notification sender
  const isNotificationSender = senderPatterns.some(pattern => fromLower.includes(pattern));
  
  // Check if content matches notification patterns
  const hasNotificationPattern = notificationPatterns.some(pattern => 
    contentLower.includes(pattern) || subjectLower.includes(pattern)
  );

  // Additional checks for automated content
  const hasAutomatedIndicators = (
    contentLower.includes('this is an automated') ||
    contentLower.includes('do not reply to this') ||
    contentLower.includes('automatically generated') ||
    subjectLower.includes('[automated]') ||
    subjectLower.includes('auto:')
  );

  return isNotificationSender || hasNotificationPattern || hasAutomatedIndicators;
}

function isJobRelatedEmail(content: string, from: string, subject: string): boolean {
  // First check if it's a job board notification we should filter out
  if (isJobBoardNotification(content, from, subject)) {
    return false;
  }

  const jobKeywords = [
    'job', 'application', 'position', 'role', 'interview', 'hiring', 'recruiter',
    'hr', 'human resources', 'talent', 'career', 'opportunity', 'employment',
    'candidate', 'resume', 'cv', 'screening', 'phone screen'
  ];

  const commonJobSites = [
    'linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 'dice',
    'stackoverflow', 'github', 'angel.co', 'wellfound', 'hired'
  ];

  const hasJobKeywords = jobKeywords.some(keyword => content.includes(keyword));
  const isFromJobSite = commonJobSites.some(site => from.toLowerCase().includes(site));
  
  // Additional check for recruiter emails
  const recruiterIndicators = [
    'recruiter', 'recruiting', 'talent acquisition', 'hr specialist',
    'hiring manager', 'people operations', 'people team'
  ];
  const isFromRecruiter = recruiterIndicators.some(indicator => 
    content.includes(indicator) || from.toLowerCase().includes(indicator)
  );
  
  return hasJobKeywords || isFromJobSite || isFromRecruiter;
}

function extractCompany(from: string, body: string = '', subject: string = ''): string | null {
  // Enhanced company extraction with better filtering
  
  // First try to extract from email domain
  const domainMatch = from.match(/@([^.]+)\./);
  if (domainMatch) {
    const domain = domainMatch[1].toLowerCase();
    
    // Extended list of domains to exclude
    const excludedDomains = [
      'gmail', 'yahoo', 'outlook', 'hotmail', 'aol', 'icloud',
      'linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 'dice',
      'stackoverflow', 'github', 'angel', 'wellfound', 'hired',
      'workday', 'greenhouse', 'lever', 'jobvite', 'smartrecruiters',
      'brassring', 'icims', 'kronos', 'successfactors', 'taleo',
      'bamboohr', 'namely', 'zenefits', 'gusto', 'adp',
      'noreply', 'no-reply', 'donotreply', 'automated', 'notifications'
    ];
    
    if (!excludedDomains.includes(domain)) {
      // Clean up and format domain name
      let companyName = domain;
      
      // Remove common suffixes
      companyName = companyName.replace(/^(www\.|mail\.|hr\.|jobs\.|careers\.|recruiting\.)/, '');
      companyName = companyName.replace(/(corp|inc|llc|ltd|co)$/, '');
      
      // Capitalize properly
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      
      return companyName;
    }
  }

  // Try to extract from email signature or body
  const companyPatterns = [
    // "From [Company Name]" patterns
    /from\s+([A-Z][a-zA-Z\s&.]+?)(?:\s+team|\s+hiring|\s+hr|\s+recruiting|,|\.|$)/i,
    
    // "At [Company Name]" patterns  
    /(?:at|with|for)\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|,|\.|$)/i,
    
    // Company signature patterns
    /([A-Z][a-zA-Z\s&.]+?)(?:\s+Inc\.?|\s+Corp\.?|\s+LLC|\s+Ltd\.?)/i,
    
    // "We are [Company Name]" patterns
    /(?:we are|i am with|i work at|i represent)\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|,|\.|$)/i,
    
    // Email signature patterns
    /^([A-Z][a-zA-Z\s&.]{2,30})$/m
  ];

  const fullText = `${subject} ${body}`;
  
  for (const pattern of companyPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      let companyName = match[1].trim();
      
      // Filter out generic terms
      const genericTerms = [
        'team', 'hr', 'human resources', 'recruiting', 'talent', 'hiring',
        'notification', 'noreply', 'no reply', 'automated', 'system',
        'admin', 'support', 'customer service', 'help desk', 'info',
        'sales', 'marketing', 'newsletter', 'updates', 'alerts',
        'jobs', 'careers', 'opportunities', 'positions', 'roles',
        'application', 'applications', 'candidate', 'candidates',
        'recruiter', 'recruiters', 'staffing', 'employment'
      ];
      
      const isGeneric = genericTerms.some(term => 
        companyName.toLowerCase().includes(term) || 
        companyName.toLowerCase() === term
      );
      
      // Check minimum length and format
      if (!isGeneric && companyName.length >= 2 && companyName.length <= 50) {
        // Clean up company name
        companyName = companyName.replace(/[^\w\s&.-]/g, '').trim();
        
        // Skip if it's just numbers or too short after cleaning
        if (companyName.length >= 2 && !/^\d+$/.test(companyName)) {
          return companyName;
        }
      }
    }
  }

  // Try to extract from "From:" header more intelligently
  const fromNameMatch = from.match(/^(.+?)\s*<.*>$/);
  if (fromNameMatch) {
    let fromName = fromNameMatch[1].trim().replace(/['"]/g, '');
    
    // Skip if it looks like a person's name (first last format)
    const nameWords = fromName.split(/\s+/);
    const looksLikePersonName = nameWords.length === 2 && 
      nameWords.every(word => word.length >= 2 && word.charAt(0) === word.charAt(0).toUpperCase());
    
    if (!looksLikePersonName && fromName.length >= 2 && fromName.length <= 50) {
      const genericTerms = [
        'noreply', 'no-reply', 'donotreply', 'automated', 'system',
        'notification', 'notifications', 'alerts', 'updates', 'digest',
        'jobs', 'careers', 'recruiting', 'hr', 'hiring', 'talent'
      ];
      
      const isGeneric = genericTerms.some(term => fromName.toLowerCase().includes(term));
      
      if (!isGeneric) {
        return fromName;
      }
    }
  }

  return null;
}

function extractJobTitle(content: string, subject: string = ''): string | null {
  // Enhanced job title extraction with more patterns
  const fullText = `${subject} ${content}`;
  
  const titlePatterns = [
    // Direct position patterns
    /(?:for the|for a|as a|as an)\s+([a-zA-Z\s]+?)(?:\s+position|\s+role|\s+job|\s+at)/i,
    /(?:position of|role of|job of|title of)\s+([a-zA-Z\s]+?)(?:\s|,|\.|$)/i,
    
    // Application patterns
    /(?:applied for|applying for|application for)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+position|\s+role|\s+job|\s+at|\s|,|\.|$)/i,
    
    // Interest patterns
    /(?:interested in|regarding)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+position|\s+role|\s+job|\s+opening|\s+opportunity|\s+at|\s|,|\.|$)/i,
    
    // Opening patterns
    /(?:opening for|opportunity for|vacancy for)\s+(?:a\s+|an\s+)?([a-zA-Z\s]+?)(?:\s+position|\s+role|\s+at|\s|,|\.|$)/i,
    
    // Subject line patterns
    /^(?:re:\s*)?(?:application|apply|applying|interested).*?(?:for\s+)?([a-zA-Z\s]+?)(?:\s+position|\s+role|\s+job|\s+at|\s+-|\s|$)/i,
    
    // Common job titles (more specific matching)
    /(software\s+engineer|full\s+stack\s+developer|frontend\s+developer|backend\s+developer|web\s+developer|mobile\s+developer|data\s+scientist|data\s+analyst|product\s+manager|project\s+manager|ui\/ux\s+designer|graphic\s+designer|devops\s+engineer|system\s+administrator|database\s+administrator|qa\s+engineer|test\s+engineer|business\s+analyst|technical\s+writer|sales\s+manager|marketing\s+manager|hr\s+manager|operations\s+manager|customer\s+success\s+manager|account\s+manager|software\s+architect|solutions\s+architect|security\s+engineer|network\s+engineer|cloud\s+engineer)/i,
    
    // Generic titles with context
    /(engineer|developer|programmer|analyst|manager|designer|architect|specialist|coordinator|director|lead|senior|junior)\s+(?:position|role)/i,
    
    // Title with level
    /((?:senior|junior|lead|principal|staff)\s+[a-zA-Z\s]+?(?:engineer|developer|manager|analyst|designer))/i
  ];

  for (const pattern of titlePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      let title = match[1].trim();
      
      // Clean up the title
      title = title.replace(/[^\w\s/-]/g, '').trim();
      
      // Filter out generic terms that aren't job titles
      const excludeTerms = [
        'application', 'position', 'role', 'job', 'opportunity', 'opening',
        'notification', 'alert', 'update', 'digest', 'newsletter',
        'team', 'company', 'organization', 'department', 'division',
        'and', 'or', 'the', 'a', 'an', 'of', 'in', 'at', 'for', 'with'
      ];
      
      const isValidTitle = title.length >= 3 && 
        title.length <= 50 && 
        !excludeTerms.includes(title.toLowerCase()) &&
        !/^\d+$/.test(title) && // Not just numbers
        /[a-zA-Z]/.test(title); // Contains letters
      
      if (isValidTitle) {
        // Capitalize properly
        title = title.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        return title;
      }
    }
  }

  return null;
}

function determineStatus(content: string): 'applied' | 'interviewing' | 'offered' | 'rejected' | 'ghosted' {
  const statusIndicators = {
    applied: ['application received', 'thank you for applying', 'we have received your application'],
    interviewing: ['interview', 'schedule a call', 'phone screen', 'technical interview'],
    offered: ['offer', 'congratulations', 'pleased to offer', 'job offer'],
    rejected: ['unfortunately', 'not moving forward', 'other candidates', 'different direction']
  };

  for (const [status, indicators] of Object.entries(statusIndicators)) {
    for (const indicator of indicators) {
      if (content.includes(indicator.toLowerCase())) {
        return status as any;
      }
    }
  }

  return 'applied';
}

export async function POST(request: NextRequest) {
  try {
    console.log('Email scan request received');
    
    const body = await request.json();
    const { credentials } = body;
    
    console.log('Request body:', { credentials: credentials ? 'present' : 'missing' });
    
    if (!credentials) {
      console.log('No credentials provided');
      return NextResponse.json({ error: 'Credentials are required' }, { status: 400 });
    }

    console.log('Setting up OAuth client...');
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`
    );

    oauth2Client.setCredentials(credentials);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log('Searching for emails...');
    // Search for job-related emails
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const query = `after:${thirtyDaysAgo.toISOString().split('T')[0]} (job OR application OR interview OR offer OR position OR hiring OR recruiter)`;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });

    console.log(`Found ${response.data.messages?.length || 0} messages`);

    const jobApplications = [];
    let totalEmails = 0;

    if (response.data.messages) {
      totalEmails = response.data.messages.length;

      for (const message of response.data.messages) {
        try {
          if (!message.id) continue;
          
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const messageData = fullMessage.data;
          if (!messageData?.payload) continue;

          const headers = messageData.payload.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
          const from = headers.find((h: any) => h.name === 'From')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          let body = '';
          if (messageData.payload.body?.data) {
            body = Buffer.from(messageData.payload.body.data, 'base64').toString();
          } else if (messageData.payload.parts) {
            const textPart = messageData.payload.parts.find((part: any) => 
              part.mimeType === 'text/plain' || part.mimeType === 'text/html'
            );
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString();
            }
          }

          const content = `${subject} ${body}`.toLowerCase();
          
          if (isJobRelatedEmail(content, from, subject)) {
            const company = extractCompany(from, body, subject);
            const jobTitle = extractJobTitle(content, subject);
            const status = determineStatus(content);
            
            // Enhanced confidence calculation
            let confidence = 0.2; // Lower base confidence due to better filtering
            
            // Company extraction confidence
            if (company && company !== 'Unknown Company') {
              // Higher confidence for non-generic company names
              if (company.length > 2 && !company.toLowerCase().includes('team')) {
                confidence += 0.4;
              } else {
                confidence += 0.2;
              }
            }
            
            // Job title confidence
            if (jobTitle && jobTitle !== 'Unknown Position') {
              confidence += 0.3;
            }
            
            // Subject line indicators
            const subjectLower = subject.toLowerCase();
            if (subjectLower.includes('application') && subjectLower.includes('received')) {
              confidence += 0.3;
            } else if (subjectLower.includes('interview') || subjectLower.includes('schedule')) {
              confidence += 0.4;
            } else if (subjectLower.includes('offer') || subjectLower.includes('congratulations')) {
              confidence += 0.5;
            } else if (subjectLower.includes('job') || subjectLower.includes('position')) {
              confidence += 0.2;
            }
            
            // Reduce confidence for potential false positives
            const contentLower = content.toLowerCase();
            if (contentLower.includes('newsletter') || contentLower.includes('digest') || 
                contentLower.includes('marketing') || contentLower.includes('promotional') ||
                contentLower.includes('unsubscribe') || contentLower.includes('you may be interested')) {
              confidence -= 0.4;
            }
            
            // Personal email indicators (higher confidence)
            if (from.includes('@') && !from.includes('noreply') && !from.includes('no-reply')) {
              const fromParts = from.split('@');
              if (fromParts[0] && fromParts[0].includes('.') || fromParts[0].match(/[a-z]+[A-Z]/)) {
                confidence += 0.2; // Looks like a personal email
              }
            }

            if (confidence >= 0.5) { // Lowered threshold since we have better filtering
              jobApplications.push({
                messageId: message.id,
                threadId: messageData.threadId, // Also store thread ID for Gmail URLs
                company: company || 'Unknown Company',
                jobTitle: jobTitle || 'Unknown Position',
                status,
                confidence,
                date: new Date(date),
                emailSubject: subject,
                emailFrom: from
              });
            }
          }
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      totalEmails,
      jobEmailsFound: jobApplications.length,
      jobApplications
    });

  } catch (error) {
    console.error('Error scanning emails:', error);
    return NextResponse.json({ error: 'Failed to scan emails' }, { status: 500 });
  }
}
