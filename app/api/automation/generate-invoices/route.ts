import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { autoGenerateInvoices } from '@/lib/automation/invoice-generation';

/**
 * Generate invoices for delivered loads
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const result = await autoGenerateInvoices(session.user.companyId);

    return NextResponse.json({
      success: result.success,
      data: {
        invoicesGenerated: result.invoicesGenerated,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

