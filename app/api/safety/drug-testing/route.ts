import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DrugTestingManager } from '@/lib/managers/DrugTestingManager';
import { AppError } from '@/lib/errors/AppError';

/**
 * GET /api/safety/drug-testing — Fetch upcoming testing schedule
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedule = await DrugTestingManager.getTestingSchedule(session.user.companyId);
    return NextResponse.json({ data: schedule });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    console.error('Error fetching drug testing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testing schedule' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/safety/drug-testing — Trigger testing actions
 *
 * Body: { action: 'random' | 'post-incident' | 'failed-test', ... }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'random') {
      const poolType = body.poolType === 'ALCOHOL' ? 'ALCOHOL' : 'DRUG';
      const result = await DrugTestingManager.scheduleRandomTest(
        session.user.companyId,
        poolType as 'DRUG' | 'ALCOHOL'
      );
      return NextResponse.json({ data: result }, { status: 201 });
    }

    if (action === 'post-incident') {
      if (!body.driverId) {
        return NextResponse.json(
          { error: 'driverId is required for post-incident test' },
          { status: 400 }
        );
      }
      const result = await DrugTestingManager.handlePostIncident(
        body.driverId,
        body.incidentId
      );
      return NextResponse.json({ data: result }, { status: 201 });
    }

    if (action === 'failed-test') {
      if (!body.driverId || !body.testId) {
        return NextResponse.json(
          { error: 'driverId and testId are required for failed-test protocol' },
          { status: 400 }
        );
      }
      const result = await DrugTestingManager.handleFailedTest(body.driverId, body.testId);
      return NextResponse.json({ data: result }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: random, post-incident, or failed-test' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    console.error('Error processing drug testing action:', error);
    return NextResponse.json(
      { error: 'Failed to process drug testing action' },
      { status: 500 }
    );
  }
}
