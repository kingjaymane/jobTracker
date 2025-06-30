import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL
    }
  });
}
