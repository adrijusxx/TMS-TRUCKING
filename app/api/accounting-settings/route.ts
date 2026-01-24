import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VALIDATION_CONFIG } from '@/lib/validations/settlement-validation';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.accountingSettings.findUnique({
        where: { companyId: session.user.companyId },
    });

    return NextResponse.json(settings || { ...DEFAULT_VALIDATION_CONFIG, settlementValidationMode: 'FLEXIBLE' });
}
