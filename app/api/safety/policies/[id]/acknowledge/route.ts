import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { safetyPolicyManager } from '@/lib/managers/SafetyPolicyManager';
import { acknowledgePolicySchema } from '@/lib/validations/safety-policy';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = acknowledgePolicySchema.parse(body);

    const driverId = body.driverId || session.user.id;
    const result = await safetyPolicyManager.acknowledgePolicy(id, driverId, parsed.signature);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    return NextResponse.json({ error: 'Failed to acknowledge policy' }, { status: 500 });
  }
}
