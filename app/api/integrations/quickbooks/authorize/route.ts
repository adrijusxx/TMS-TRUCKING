import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getQuickBooksAuthUrl } from '@/lib/integrations/quickbooks';

/**
 * Initiate QuickBooks OAuth authorization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Generate state to prevent CSRF attacks
    const state = Buffer.from(
      JSON.stringify({ companyId: session.user.companyId, userId: session.user.id })
    ).toString('base64');

    const authUrl = getQuickBooksAuthUrl(state);

    if (!authUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_CONFIGURED',
            message: 'QuickBooks API credentials not configured',
          },
        },
        { status: 400 }
      );
    }

    // Redirect to QuickBooks authorization page
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('QuickBooks authorization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to initiate QuickBooks authorization',
        },
      },
      { status: 500 }
    );
  }
}

