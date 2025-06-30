import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    console.log('Email message fetch request received');
    
    const requestBody = await request.json();
    const { messageId, credentials } = requestBody;
    
    console.log('Request body:', { 
      messageId: messageId ? 'present' : 'missing',
      credentials: credentials ? 'present' : 'missing' 
    });
    
    if (!messageId) {
      console.log('No messageId provided');
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Try to get credentials from request body first, then from stored session
    let emailCredentials = credentials;
    
    if (!emailCredentials) {
      // In a real app, you'd get this from user session/database
      // For now, return an error asking to reconnect
      return NextResponse.json({ 
        error: 'No credentials available. Please reconnect your Gmail account.' 
      }, { status: 401 });
    }

    console.log('Setting up OAuth client...');
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`
    );

    oauth2Client.setCredentials(emailCredentials);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log(`Fetching message: ${messageId}`);
    
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const messageData = response.data;
    
    if (!messageData?.payload) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const headers = messageData.payload.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
    const from = headers.find((h: any) => h.name === 'From')?.value || '';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '';

    let emailBody = '';
    
    // Extract email body
    if (messageData.payload.body?.data) {
      emailBody = Buffer.from(messageData.payload.body.data, 'base64').toString();
    } else if (messageData.payload.parts) {
      // Look for text/plain first, then text/html
      const textPart = messageData.payload.parts.find((part: any) => 
        part.mimeType === 'text/plain'
      );
      const htmlPart = messageData.payload.parts.find((part: any) => 
        part.mimeType === 'text/html'
      );
      
      const selectedPart = textPart || htmlPart;
      if (selectedPart?.body?.data) {
        emailBody = Buffer.from(selectedPart.body.data, 'base64').toString();
      }
    }

    console.log('Message fetched successfully');

    return NextResponse.json({
      subject,
      from,
      date,
      body: emailBody,
      messageId,
      threadId: messageData.threadId
    });

  } catch (error: any) {
    console.error('Error fetching email message:', error);
    
    // Handle specific Gmail API errors
    if (error.code === 404) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    if (error.code === 401 || error.code === 403) {
      return NextResponse.json({ 
        error: 'Authentication failed. Please reconnect your Gmail account.' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch email message',
      details: error.message 
    }, { status: 500 });
  }
}
