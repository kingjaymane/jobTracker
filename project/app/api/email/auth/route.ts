import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    console.log('=== Auth URL Generation Debug ===');
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    console.log('Environment variables check:');
    console.log('- CLIENT_ID:', clientId ? `present (${clientId.substring(0, 10)}...)` : 'MISSING');
    console.log('- CLIENT_SECRET:', clientSecret ? 'present' : 'MISSING');
    console.log('- BASE_URL:', baseUrl || 'MISSING');

    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
      return NextResponse.json({ 
        error: 'Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable' 
      }, { status: 500 });
    }

    if (!clientSecret) {
      console.error('GOOGLE_CLIENT_SECRET is missing');
      return NextResponse.json({ 
        error: 'Missing GOOGLE_CLIENT_SECRET environment variable' 
      }, { status: 500 });
    }

    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is missing');
      return NextResponse.json({ 
        error: 'Missing NEXT_PUBLIC_BASE_URL environment variable' 
      }, { status: 500 });
    }

    const redirectUri = `${baseUrl}/api/auth/gmail/callback`;
    console.log('Redirect URI:', redirectUri);

    // Create OAuth2 client here to catch any initialization errors
    console.log('Creating OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    console.log('Generating auth URL with scopes:', scopes);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log('Auth URL generated successfully');
    console.log('Auth URL length:', authUrl.length);

    return NextResponse.json({ 
      authUrl, 
      redirectUri,
      success: true 
    });
    
  } catch (error) {
    console.error('=== Auth URL Generation Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'Failed to generate auth URL',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
