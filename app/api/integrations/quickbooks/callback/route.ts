import { NextRequest, NextResponse } from 'next/server';
import { exchangeQuickBooksCode } from '@/lib/integrations/quickbooks';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/encryption';

/**
 * Handle QuickBooks OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId'); // QuickBooks company ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !realmId || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=missing_parameters', request.url)
      );
    }

    // Decode state to get company ID
    let decodedState: { companyId: string; userId: string };
    try {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeQuickBooksCode(code, realmId);

    if (!tokenResponse) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=token_exchange_failed', request.url)
      );
    }

    // Calculate token expiration (typically expires in 1 hour, refresh before)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 1);

    // Store tokens in Integration model (encrypted)
    await prisma.integration.upsert({
      where: {
        companyId_provider: {
          companyId: decodedState.companyId,
          provider: 'QUICKBOOKS',
        },
      },
      create: {
        companyId: decodedState.companyId,
        provider: 'QUICKBOOKS',
        realmId,
        accessToken: encrypt(tokenResponse.access_token), // Encrypt sensitive token
        refreshToken: encrypt(tokenResponse.refresh_token), // Encrypt sensitive token
        tokenExpiresAt,
        isActive: true,
        lastSyncStatus: 'success',
      },
      update: {
        realmId,
        accessToken: encrypt(tokenResponse.access_token),
        refreshToken: encrypt(tokenResponse.refresh_token),
        tokenExpiresAt,
        isActive: true,
        lastSyncStatus: 'success',
        lastError: null,
      },
    });

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings?quickbooks_connected=true', request.url)
    );
  } catch (error: any) {
    console.error('QuickBooks callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?error=${encodeURIComponent(error.message || 'callback_failed')}`,
        request.url
      )
    );
  }
}

