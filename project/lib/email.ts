import { google } from 'googleapis';
import { User } from 'firebase/auth';

export interface EmailAuthCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  snippet: string;
  labels: string[];
}

export interface JobApplicationEmail {
  messageId: string;
  company: string;
  jobTitle: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'ghosted';
  confidence: number;
  date: Date;
  emailSubject: string;
  emailFrom: string;
  extractedInfo: {
    interviewDate?: Date;
    interviewType?: string;
    rejectionReason?: string;
    offerDetails?: string;
    nextSteps?: string;
  };
}

class EmailService {
  private oauth2Client: any;
  private gmail: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokenFromCode(code: string): Promise<EmailAuthCredentials> {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    return tokens as EmailAuthCredentials;
  }

  async setCredentials(credentials: EmailAuthCredentials) {
    this.oauth2Client.setCredentials(credentials);
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async refreshAccessToken(refreshToken: string): Promise<EmailAuthCredentials> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials as EmailAuthCredentials;
  }

  async getRecentMessages(maxResults: number = 50, query?: string): Promise<EmailMessage[]> {
    if (!this.gmail) {
      throw new Error('Gmail client not initialized. Call setCredentials first.');
    }

    const searchQuery = query || 'in:inbox (job OR application OR interview OR offer OR position OR hiring OR recruiter OR HR)';
    
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: maxResults
    });

    const messages: EmailMessage[] = [];

    if (response.data.messages) {
      for (const message of response.data.messages) {
        try {
          const fullMessage = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const headers = fullMessage.data.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
          const from = headers.find((h: any) => h.name === 'From')?.value || '';
          const to = headers.find((h: any) => h.name === 'To')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          let body = '';
          if (fullMessage.data.payload.body?.data) {
            body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString();
          } else if (fullMessage.data.payload.parts) {
            const textPart = fullMessage.data.payload.parts.find((part: any) => 
              part.mimeType === 'text/plain' || part.mimeType === 'text/html'
            );
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString();
            }
          }

          messages.push({
            id: message.id,
            threadId: fullMessage.data.threadId,
            subject,
            from,
            to,
            date: new Date(date),
            body,
            snippet: fullMessage.data.snippet || '',
            labels: fullMessage.data.labelIds || []
          });
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
        }
      }
    }

    return messages;
  }

  async markAsProcessed(messageId: string): Promise<void> {
    if (!this.gmail) return;

    try {
      // Add a custom label to mark as processed by job tracker
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          addLabelIds: ['PROCESSED_JOB_TRACKER']
        }
      });
    } catch (error) {
      console.log('Label may not exist, creating or skipping:', error);
    }
  }

  async createJobTrackerLabel(): Promise<void> {
    if (!this.gmail) return;

    try {
      await this.gmail.users.labels.create({
        userId: 'me',
        resource: {
          name: 'PROCESSED_JOB_TRACKER',
          messageListVisibility: 'hide',
          labelListVisibility: 'labelHide'
        }
      });
    } catch (error) {
      console.log('Label already exists or error creating:', error);
    }
  }
}

export const emailService = new EmailService();
