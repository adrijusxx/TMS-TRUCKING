import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { VendorBillManager } from '@/lib/managers/VendorBillManager';
import { handleApiError } from '@/lib/api/route-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mcNumber = searchParams.get('mcNumber') || undefined;

    const balances = await VendorBillManager.getAllVendorBalances(
      session.user.companyId,
      mcNumber
    );

    const totalDue = balances.reduce((s, b) => s + b.totalDue, 0);
    const totalBills = balances.reduce((s, b) => s + b.billCount, 0);

    return NextResponse.json({
      success: true,
      data: balances,
      summary: { totalDue, totalBills, vendorCount: balances.length },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
