import { NextRequest, NextResponse } from 'next/server';
import { getJobApplications, addJobApplication } from '@/lib/firestore';
import { auth } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    // For browser console testing, we'll try to get user from headers or session
    // In a real app, you'd use proper authentication middleware
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }
    
    // This is a simplified version for testing
    // In production, you'd validate the auth token properly
    const userId = authHeader.replace('Bearer ', '');
    
    const jobs = await getJobApplications(userId);
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }
    
    const userId = authHeader.replace('Bearer ', '');
    
    const jobId = await addJobApplication(body, userId);
    return NextResponse.json({ id: jobId, success: true });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
