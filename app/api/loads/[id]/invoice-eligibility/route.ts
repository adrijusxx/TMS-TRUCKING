import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';

/**
 * GET /api/loads/[id]/invoice-eligibility
 * Check if a load is eligible for invoicing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const invoiceManager = new InvoiceManager();
    const result = await invoiceManager.isReadyToBill(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error checking invoice eligibility:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to check invoice eligibility' },
      },
      { status: 500 }
    );
  }
}

