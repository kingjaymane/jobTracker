import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`
);

export async function POST(request: NextRequest) {
  try {
    console.log('=== Token Exchange Debug Info ===');
    console.log('Environment variables:');
    console.log('- CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'present' : 'missing');
    console.log('- CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'present' : 'missing');
    console.log('- BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('- Redirect URI:', `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`);
    
    const body = await request.json();
    const { code } = body;
    
    console.log('Request body:', { code: code ? `present (length: ${code.length})` : 'missing' });
    
    if (!code) {
      console.log('ERROR: No authorization code provided');
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.log('ERROR: Missing OAuth credentials in environment');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing OAuth credentials' 
      }, { status: 500 });
    }

    console.log('Attempting to exchange code for tokens...');
    console.log('OAuth2 client config:', {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`
    });
    
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Token exchange successful, tokens received:', {
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    });
    
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('=== Token Exchange Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        return NextResponse.json({ 
          error: 'Authorization code has expired or is invalid. Please try connecting again.',
          details: error.message
        }, { status: 400 });
      }
      
      if (error.message.includes('redirect_uri_mismatch')) {
        return NextResponse.json({ 
          error: 'Redirect URI mismatch. Please check your Google Cloud Console configuration.',
          details: error.message
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to exchange authorization code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
