import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getSamsaraConfig, getSamsaraVehicles } from '@/lib/integrations/samsara';
import { getQuickBooksConfig } from '@/lib/integrations/quickbooks';
import { decrypt } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const integrations: any[] = [];

    // Check Samsara
    const samsaraConfig = await getSamsaraConfig(session.user.companyId);
    const samsaraIntegration = await prisma.integration.findUnique({
      where: {
        companyId_provider: {
          companyId: session.user.companyId,
          provider: 'SAMSARA',
        },
      },
    });

    let samsaraConnected = false;
    let samsaraDriverCount = 0;

    if (samsaraConfig && samsaraConfig.apiKey) {
      try {
        // Test connection by attempting to fetch vehicles
        const vehicles = await getSamsaraVehicles();
        samsaraConnected = vehicles !== null && Array.isArray(vehicles);
        if (samsaraConnected && vehicles && vehicles.length > 0) {
          // Get driver count - you can also fetch drivers separately
          samsaraDriverCount = vehicles.length;
        }
      } catch (error) {
        console.error('Samsara connection check failed:', error);
        samsaraConnected = false;
      }
    }

    integrations.push({
      provider: 'SAMSARA',
      configured: !!samsaraConfig?.apiKey,
      connected: samsaraConnected,
      isActive: samsaraIntegration?.isActive || false,
      lastSyncAt: samsaraIntegration?.lastSyncAt?.toISOString(),
      lastSyncStatus: samsaraIntegration?.lastSyncStatus,
      lastError: samsaraIntegration?.lastError,
      driverCount: samsaraDriverCount,
    });

    // Check QuickBooks
    const qbConfig = getQuickBooksConfig();
    const qbIntegration = await prisma.integration.findUnique({
      where: {
        companyId_provider: {
          companyId: session.user.companyId,
          provider: 'QUICKBOOKS',
        },
      },
    });

    let qbConnected = false;
    if (qbIntegration && qbIntegration.isActive) {
      // Check if token is still valid
      const hasValidToken = qbIntegration.accessToken && 
        (!qbIntegration.tokenExpiresAt || qbIntegration.tokenExpiresAt > new Date());
      qbConnected = hasValidToken || false;
    }

    integrations.push({
      provider: 'QUICKBOOKS',
      configured: !!qbConfig?.clientId && !!qbConfig?.clientSecret,
      connected: qbConnected,
      isActive: qbIntegration?.isActive || false,
      lastSyncAt: qbIntegration?.lastSyncAt?.toISOString(),
      lastSyncStatus: qbIntegration?.lastSyncStatus,
      lastError: qbIntegration?.lastError,
      realmId: qbIntegration?.realmId || null,
      authUrl: qbConfig ? '/api/integrations/quickbooks/authorize' : null,
    });

    // Check Google Maps
    integrations.push({
      provider: 'GOOGLE_MAPS',
      configured: !!process.env.GOOGLE_MAPS_API_KEY && !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      connected: !!process.env.GOOGLE_MAPS_API_KEY && !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: integrations,
    });
  } catch (error: any) {
    console.error('Integration status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to check integration status' },
      },
      { status: 500 }
    );
  }
}

