// @ts-ignore - compromise doesn't have great TypeScript support
import nlp from 'compromise';
import { JobApplicationEmail, EmailMessage } from './email';

interface CompanyPattern {
  patterns: string[];
  type: 'domain' | 'signature' | 'header';
}

interface JobTitlePattern {
  keywords: string[];
  context: string[];
}

interface StatusIndicators {
  applied: string[];
  interviewing: string[];
  offered: string[];
  rejected: string[];
  ghosted: string[];
}

class EmailAnalysisService {
  private companyPatterns: CompanyPattern[] = [
    {
      patterns: ['@(.+?)\\.com', '@(.+?)\\.org', '@(.+?)\\.net'],
      type: 'domain'
    }
  ];

  private jobTitlePatterns: JobTitlePattern[] = [
    {
      keywords: ['engineer', 'developer', 'programmer', 'analyst', 'manager', 'designer', 'architect'],
      context: ['software', 'senior', 'junior', 'full stack', 'frontend', 'backend', 'data', 'product']
    }
  ];

  private statusIndicators: StatusIndicators = {
    applied: [
      'application received', 'thank you for applying', 'we have received your application',
      'application confirmation', 'successfully submitted', 'application status'
    ],
    interviewing: [
      'interview', 'schedule a call', 'phone screen', 'technical interview', 'onsite interview',
      'video call', 'zoom meeting', 'teams meeting', 'would like to speak', 'available for a call',
      'screening call', 'next step', 'move forward', 'discuss your background'
    ],
    offered: [
      'offer', 'congratulations', 'pleased to offer', 'job offer', 'offer letter',
      'compensation', 'salary', 'benefits package', 'start date', 'welcome to the team',
      'excited to have you', 'accept the position'
    ],
    rejected: [
      'unfortunately', 'not moving forward', 'other candidates', 'different direction',
      'not a fit', 'decline', 'pass on', 'thank you for your interest but',
      'decided not to proceed', 'will not be moving', 'not selected'
    ],
    ghosted: [] // This will be determined by lack of response after certain time
  };

  private commonJobSites = [
    'linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 'dice',
    'stackoverflow', 'github', 'angel.co', 'wellfound', 'hired'
  ];

  async analyzeEmail(email: EmailMessage): Promise<JobApplicationEmail | null> {
    const content = `${email.subject} ${email.body} ${email.snippet}`.toLowerCase();
    
    // Check if this is likely a job-related email
    if (!this.isJobRelatedEmail(content, email.from, email.subject)) {
      return null;
    }

    const company = this.extractCompany(email.from, email.body, email.subject);
    const jobTitle = this.extractJobTitle(content);
    const status = this.determineStatus(content, email.date);
    const confidence = this.calculateConfidence(content, company, jobTitle, status);
    const extractedInfo = this.extractAdditionalInfo(content, status);

    // Only return if confidence is above threshold (lowered due to better filtering)
    if (confidence < 0.5) {
      return null;
    }

    return {
      messageId: email.id,
      company: company || 'Unknown Company',
      jobTitle: jobTitle || 'Unknown Position',
      status,
      confidence,
      date: email.date,
      emailSubject: email.subject,
      emailFrom: email.from,
      extractedInfo
    };
  }

  // Enhanced filtering to exclude job board notifications
  private isJobBoardNotification(content: string, from: string, subject: string): boolean {
    const notificationPatterns = [
      'jobs you may be interested in', 'recommended for you', 'new jobs posted',
      'job alert', 'daily job digest', 'weekly job digest', 'jobs matching your preferences',
      'similar jobs to ones you', 'jobs like', 'jobs near you', 'trending jobs',
      'jobs matching your search', 'recommended jobs', 'jobs from your search',
      'new jobs on indeed', 'indeed job alert', 'similar to jobs you',
      'jobs for you', 'personalized job recommendations', 'glassdoor job alert',
      'ziprecruiter job alert', 'jobs posted near', 'apply to these jobs',
      'newsletter', 'weekly update', 'digest', 'subscription', 'unsubscribe',
      'marketing', 'promotional', 'sponsored', 'advertisement', 'ad:',
      'jobs you might like', 'might interest you', 'explore opportunities',
      'browse jobs', 'view all jobs', 'see more jobs', 'apply now to',
      'quick apply', 'easy apply', 'one-click apply'
    ];

    const senderPatterns = [
      'noreply', 'no-reply', 'donotreply', 'notifications@', 'alerts@',
      'digest@', 'newsletter@', 'updates@', 'marketing@', 'automated@'
    ];

    const contentLower = content.toLowerCase();
    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();

    const isNotificationSender = senderPatterns.some(pattern => fromLower.includes(pattern));
    const hasNotificationPattern = notificationPatterns.some(pattern => 
      contentLower.includes(pattern) || subjectLower.includes(pattern)
    );
    const hasAutomatedIndicators = (
      contentLower.includes('this is an automated') ||
      contentLower.includes('do not reply to this') ||
      contentLower.includes('automatically generated')
    );

    return isNotificationSender || hasNotificationPattern || hasAutomatedIndicators;
  }

  private isJobRelatedEmail(content: string, from: string, subject: string = ''): boolean {
    // First check if it's a job board notification we should filter out
    if (this.isJobBoardNotification(content, from, subject)) {
      return false;
    }
    const jobKeywords = [
      'job', 'application', 'position', 'role', 'interview', 'hiring', 'recruiter',
      'hr', 'human resources', 'talent', 'career', 'opportunity', 'employment'
    ];

    const hasJobKeywords = jobKeywords.some(keyword => content.includes(keyword));
    const isFromJobSite = this.commonJobSites.some(site => from.toLowerCase().includes(site));
    const isFromRecruiter = content.includes('recruiter') || content.includes('talent') || from.includes('recruiting');

    return hasJobKeywords || isFromJobSite || isFromRecruiter;
  }

  private extractCompany(from: string, body: string, subject: string): string | null {
    // Enhanced company extraction
    const domainMatch = from.match(/@([^.]+)\./);
    if (domainMatch) {
      const domain = domainMatch[1].toLowerCase();
      
      // Extended exclusion list
      const excludedDomains = [
        'gmail', 'yahoo', 'outlook', 'hotmail', 'aol', 'icloud',
        ...this.commonJobSites,
        'workday', 'greenhouse', 'lever', 'jobvite', 'smartrecruiters',
        'brassring', 'icims', 'kronos', 'successfactors', 'taleo',
        'noreply', 'no-reply', 'donotreply', 'automated', 'notifications'
      ];
      
      if (!excludedDomains.includes(domain)) {
        // Clean up domain name
        let companyName = domain.replace(/^(www\.|mail\.|hr\.|jobs\.|careers\.)/, '');
        companyName = companyName.replace(/(corp|inc|llc|ltd|co)$/, '');
        return this.formatCompanyName(companyName);
      }
    }

    // Try pattern-based extraction
    const companyPatterns = [
      /from\s+([A-Z][a-zA-Z\s&.]+?)(?:\s+team|\s+hiring|\s+hr|,|\.|$)/i,
      /(?:at|with|for)\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|,|\.|$)/i,
      /([A-Z][a-zA-Z\s&.]+?)(?:\s+Inc\.?|\s+Corp\.?|\s+LLC|\s+Ltd\.?)/i,
      /(?:we are|i am with|i work at)\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|,|\.|$)/i
    ];

    const fullText = `${subject} ${body}`;
    for (const pattern of companyPatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        let companyName = match[1].trim();
        
        // Filter out generic terms
        const genericTerms = [
          'team', 'hr', 'human resources', 'recruiting', 'talent', 'hiring',
          'notification', 'noreply', 'automated', 'system', 'admin', 'support',
          'jobs', 'careers', 'opportunities', 'recruiter', 'staffing'
        ];
        
        const isGeneric = genericTerms.some(term => 
          companyName.toLowerCase().includes(term)
        );
        
        if (!isGeneric && companyName.length >= 2 && companyName.length <= 50) {
          companyName = companyName.replace(/[^\w\s&.-]/g, '').trim();
          if (companyName.length >= 2 && !/^\d+$/.test(companyName)) {
            return companyName;
          }
        }
      }
    }

    // Try to extract from "From:" header intelligently
    const fromNameMatch = from.match(/^(.+?)\s*<.*>$/);
    if (fromNameMatch) {
      let fromName = fromNameMatch[1].trim().replace(/['"]/g, '');
      
      // Skip person names and generic terms
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

  private extractJobTitle(content: string): string | null {
    const doc = nlp(content);
    
    // Look for common job title patterns
    const titlePatterns = [
      /(?:for the|for a|as a|as an)\s+([a-zA-Z\s]+?)(?:position|role|job)/i,
      /(?:position of|role of|job of)\s+([a-zA-Z\s]+?)(?:\s|,|\.|$)/i,
      /(software engineer|developer|programmer|analyst|manager|designer|architect)/i
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private determineStatus(content: string, emailDate: Date): 'applied' | 'interviewing' | 'offered' | 'rejected' | 'ghosted' {
    for (const [status, indicators] of Object.entries(this.statusIndicators)) {
      if (status === 'ghosted') continue; // Handle ghosted separately
      
      for (const indicator of indicators) {
        if (content.includes(indicator.toLowerCase())) {
          return status as any;
        }
      }
    }

    // Check for ghosted status (no response after 2 weeks from application)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    if (emailDate < twoWeeksAgo && content.includes('application')) {
      return 'ghosted';
    }

    return 'applied'; // Default status
  }

  private calculateConfidence(content: string, company: string | null, jobTitle: string | null, status: string): number {
    let confidence = 0.2; // Lower base due to better filtering

    // Company extraction confidence
    if (company && company !== 'Unknown Company') {
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

    // Check for strong status indicators
    const statusWords = this.statusIndicators[status as keyof StatusIndicators];
    const hasStrongIndicator = statusWords?.some(indicator => 
      content.includes(indicator.toLowerCase())
    );
    
    if (hasStrongIndicator) {
      confidence += 0.3;
    }

    // Reduce confidence for potential false positives
    if (content.includes('newsletter') || content.includes('unsubscribe') || 
        content.includes('marketing') || content.includes('promotional') ||
        content.includes('you may be interested') || content.includes('digest')) {
      confidence -= 0.4;
    }

    // Personal email indicators
    if (content.includes('@') && !content.includes('noreply') && !content.includes('no-reply')) {
      confidence += 0.1;
    }

    return Math.min(1, Math.max(0, confidence));
  }

  private extractAdditionalInfo(content: string, status: string): any {
    const info: any = {};

    if (status === 'interviewing') {
      // Extract interview date/time
      const dateMatches = content.match(/(?:on|at)\s+([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)/i);
      if (dateMatches) {
        info.interviewDate = new Date(dateMatches[1]);
      }

      // Extract interview type
      if (content.includes('phone')) info.interviewType = 'phone';
      else if (content.includes('video') || content.includes('zoom') || content.includes('teams')) {
        info.interviewType = 'video';
      }
      else if (content.includes('onsite') || content.includes('in person')) {
        info.interviewType = 'in-person';
      }
    }

    if (status === 'rejected') {
      // Try to extract rejection reason
      const reasonPatterns = [
        /unfortunately[^.]*?because ([^.]+)/i,
        /decided to go with ([^.]+)/i,
        /other candidates ([^.]+)/i
      ];

      for (const pattern of reasonPatterns) {
        const match = content.match(pattern);
        if (match) {
          info.rejectionReason = match[1].trim();
          break;
        }
      }
    }

    if (status === 'offered') {
      // Extract offer details
      if (content.includes('salary') || content.includes('compensation')) {
        const salaryMatch = content.match(/\$[\d,]+/);
        if (salaryMatch) {
          info.offerDetails = `Salary: ${salaryMatch[0]}`;
        }
      }
    }

    return info;
  }

  private formatCompanyName(domain: string): string {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  async batchAnalyzeEmails(emails: EmailMessage[]): Promise<JobApplicationEmail[]> {
    const results: JobApplicationEmail[] = [];
    
    for (const email of emails) {
      try {
        const analysis = await this.analyzeEmail(email);
        if (analysis) {
          results.push(analysis);
        }
      } catch (error) {
        console.error(`Error analyzing email ${email.id}:`, error);
      }
    }

    return results;
  }
}

export const emailAnalysisService = new EmailAnalysisService();
