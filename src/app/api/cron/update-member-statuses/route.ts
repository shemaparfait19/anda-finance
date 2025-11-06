/**
 * API Route for Member Status Auto-Update
 * 
 * This endpoint can be called:
 * 1. Manually via API call
 * 2. By a cron job service (e.g., Vercel Cron, GitHub Actions)
 * 3. By a scheduled task
 */

import { NextResponse } from 'next/server';
import { updateMemberStatuses } from '@/lib/member-status-updater';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional: Add authentication/authorization here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('🔄 Starting member status update...');
    const result = await updateMemberStatuses();

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.updated} member(s)`,
      updated: result.updated,
      details: result.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in member status update cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update member statuses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Allow POST requests as well for manual triggers
  return GET(request);
}
