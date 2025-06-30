// Client-side email service that uses API routes
export interface EmailAuthCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface JobApplicationEmail {
  messageId: string;
  threadId?: string;
  company: string;
  jobTitle: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'ghosted';
  confidence: number;
  date: Date;
  emailSubject: string;
  emailFrom: string;
}

class ClientEmailService {
  async getAuthUrl(): Promise<string> {
    console.log('=== Client Email Service: Getting Auth URL ===');
    
    try {
      console.log('Fetching auth URL from /api/email/auth...');
      const response = await fetch('/api/email/auth');
      console.log('Auth URL response status:', response.status);
      console.log('Auth URL response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is HTML (likely a 404 or error page)
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML response instead of JSON - API route may not be working');
        const htmlText = await response.text();
        console.error('HTML response (first 200 chars):', htmlText.substring(0, 200));
        throw new Error('API route not found or not functioning. Please check server setup.');
      }
      
      const data = await response.json();
      console.log('Auth URL response data:', data);
      
      if (!response.ok) {
        console.error('Auth URL request failed:', data);
        throw new Error(data.error || `HTTP ${response.status}: Failed to get auth URL`);
      }
      
      if (!data.authUrl) {
        console.error('Auth URL missing from response:', data);
        throw new Error('Auth URL missing from server response');
      }
      
      console.log('Auth URL obtained successfully:', data.authUrl);
      return data.authUrl;
    } catch (error) {
      console.error('Error in getAuthUrl:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred while getting auth URL');
      }
    }
  }

  async getTokenFromCode(code: string): Promise<EmailAuthCredentials> {
    const response = await fetch('/api/email/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to exchange code for tokens');
    }
    
    return data.tokens;
  }

  async scanEmails(credentials: EmailAuthCredentials): Promise<{
    totalEmails: number;
    jobEmailsFound: number;
    jobApplications: JobApplicationEmail[];
  }> {
    const response = await fetch('/api/email/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentials }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to scan emails');
    }
    
    // Convert date strings back to Date objects
    data.jobApplications = data.jobApplications.map((app: any) => ({
      ...app,
      date: new Date(app.date)
    }));
    
    return data;
  }
}

export const clientEmailService = new ClientEmailService();
