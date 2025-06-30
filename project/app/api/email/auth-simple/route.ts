import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('=== Simple Auth URL Test ===');
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    console.log('Environment check:');
    console.log('- CLIENT_ID:', clientId ? 'present' : 'MISSING');
    console.log('- BASE_URL:', baseUrl || 'MISSING');

    if (!clientId || !baseUrl) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        details: {
          clientId: clientId ? 'present' : 'missing',
          baseUrl: baseUrl || 'missing'
        }
      }, { status: 500 });
    }

    // Manual auth URL construction (without googleapis)
    const redirectUri = `${baseUrl}/api/auth/gmail/callback`;
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('Manual auth URL generated successfully');

    return NextResponse.json({ 
      authUrl,
      redirectUri,
      success: true,
      method: 'manual'
    });
    
  } catch (error) {
    console.error('Simple auth URL error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate auth URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
