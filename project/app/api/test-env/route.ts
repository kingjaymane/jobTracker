import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ? 'Set' : 'Not Set',
    callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`
  });
}
