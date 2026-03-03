import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DriverRiskScoreManager } from '@/lib/managers/DriverRiskScoreManager';
import { AppError } from '@/lib/errors/AppError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId } = await params;
    const result = await DriverRiskScoreManager.calculateRiskScore(driverId);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    console.error('Error calculating driver risk score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate driver risk score' },
      { status: 500 }
    );
  }
}
