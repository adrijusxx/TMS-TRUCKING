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
    const vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!vendorId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'vendorId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const statement = await VendorBillManager.getVendorStatement(
      vendorId,
      session.user.companyId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ success: true, data: statement });
  } catch (error) {
    return handleApiError(error);
  }
}
