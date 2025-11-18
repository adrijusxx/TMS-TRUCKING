import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createQuickBooksInvoice, refreshQuickBooksToken } from '@/lib/integrations/quickbooks';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { retry } from '@/lib/utils/retry';
import { z } from 'zod';

const syncInvoiceSchema = z.object({
  invoiceId: z.string(),
  realmId: z.string().optional(), // QuickBooks company ID
});

/**
 * Sync an invoice to QuickBooks
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

    const body = await request.json();
    const { invoiceId, realmId } = syncInvoiceSchema.parse(body);

    // Fetch invoice with related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        },
        { status: 404 }
      );
    }

    // Fetch loads
    const loads = invoice.loadIds && invoice.loadIds.length > 0
      ? await prisma.load.findMany({
          where: {
            id: { in: invoice.loadIds },
            companyId: session.user.companyId,
          },
        })
      : [];

    // Get QuickBooks integration
    const integration = await prisma.integration.findUnique({
      where: {
        companyId_provider: {
          companyId: session.user.companyId,
          provider: 'QUICKBOOKS',
        },
      },
    });

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_CONFIGURED',
            message: 'QuickBooks not connected. Please connect your QuickBooks account first.',
          },
        },
        { status: 400 }
      );
    }

    let accessToken = integration.accessToken ? decrypt(integration.accessToken) : null;
    let realmIdToUse = integration.realmId || realmId;

    if (!accessToken || !realmIdToUse) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_AUTHORIZED',
            message: 'QuickBooks not authorized. Please reconnect your account.',
          },
        },
        { status: 401 }
      );
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (integration.tokenExpiresAt && integration.tokenExpiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
      if (!integration.refreshToken) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'QuickBooks token expired. Please reconnect your account.',
            },
          },
          { status: 401 }
        );
      }

      // Refresh token
      const refreshToken = decrypt(integration.refreshToken);
      const newTokenResponse = await refreshQuickBooksToken(refreshToken);

      if (!newTokenResponse) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TOKEN_REFRESH_FAILED',
              message: 'Failed to refresh QuickBooks token. Please reconnect your account.',
            },
          },
          { status: 401 }
        );
      }

      accessToken = newTokenResponse.access_token;
      const newTokenExpiresAt = new Date();
      newTokenExpiresAt.setHours(newTokenExpiresAt.getHours() + 1);

      // Update stored token
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: encrypt(newTokenResponse.access_token),
          refreshToken: encrypt(newTokenResponse.refresh_token || refreshToken),
          tokenExpiresAt: newTokenExpiresAt,
        },
      });
    }

    // Prepare QuickBooks invoice format
    const qbInvoice = {
      DocNumber: invoice.invoiceNumber,
      TxnDate: invoice.invoiceDate.toISOString().split('T')[0],
      DueDate: invoice.dueDate.toISOString().split('T')[0],
      CustomerRef: {
        value: invoice.customer.customerNumber, // QuickBooks customer ID
        name: invoice.customer.name,
      },
      Line: loads.map((load) => ({
        Amount: load.revenue,
        Description: `Load ${load.loadNumber}: ${load.pickupCity}, ${load.pickupState} to ${load.deliveryCity}, ${load.deliveryState}`,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: '1', // Default service item - you'd map this properly
            name: 'Freight Services',
          },
          Qty: 1,
          UnitPrice: load.revenue,
        },
      })),
      TotalAmt: invoice.total,
      Balance: invoice.balance,
    };

    // Create invoice in QuickBooks with retry logic
    const qbResult = await retry(
      () => createQuickBooksInvoice(accessToken!, realmIdToUse!, qbInvoice),
      {
        maxRetries: 3,
        initialDelay: 1000,
        retryCondition: (error: any) => {
          // Retry on network errors or 5xx errors
          return error?.status >= 500 || error?.message?.includes('network');
        },
      }
    );

    if (!qbResult) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SYNC_FAILED',
            message: 'Failed to create invoice in QuickBooks',
          },
        },
        { status: 500 }
      );
    }

    // Update invoice with QuickBooks ID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        qbSynced: true,
        qbInvoiceId: qbResult.Id,
        qbSyncedAt: new Date(),
      },
    });

    // Update integration sync status
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        quickBooksId: qbResult.Id,
        invoiceNumber: qbResult.DocNumber,
      },
      message: 'Invoice synced to QuickBooks successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('QuickBooks invoice sync error:', error);

    // Update integration with error
    const session = await auth().catch(() => null);
    if (session?.user?.companyId) {
      try {
        await prisma.integration.update({
          where: {
            companyId_provider: {
              companyId: session.user.companyId,
              provider: 'QUICKBOOKS',
            },
          },
          data: {
            lastSyncStatus: 'error',
            lastError: error.message || 'Unknown error',
          },
        });
      } catch (updateError) {
        // Ignore update errors
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to sync invoice to QuickBooks',
        },
      },
      { status: 500 }
    );
  }
}

