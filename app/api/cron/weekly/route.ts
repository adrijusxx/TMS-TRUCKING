import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyAutomationTasks } from '@/lib/cron/jobs';

/**
 * Weekly cron job endpoint
 * 
 * This endpoint should be called by a cron service (Vercel Cron, GitHub Actions, etc.)
 * Recommended schedule: Weekly on Sunday at 3 AM
 * 
 * To secure this endpoint, you should:
 * 1. Add authentication (API key, secret token, etc.)
 * 2. Use environment variables for the secret
 * 3. Verify the request origin
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await runWeeklyAutomationTasks();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Weekly cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

