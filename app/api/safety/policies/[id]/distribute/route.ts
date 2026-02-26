import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { safetyPolicyManager } from '@/lib/managers/SafetyPolicyManager';
import { distributePolicySchema } from '@/lib/validations/safety-policy';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = distributePolicySchema.parse(body);
    const acknowledgments = await safetyPolicyManager.distributePolicy(
      id,
      session.user.companyId,
      parsed.driverIds
    );

    return NextResponse.json({ data: acknowledgments });
  } catch (error) {
    console.error('Error distributing policy:', error);
    return NextResponse.json({ error: 'Failed to distribute policy' }, { status: 500 });
  }
}
