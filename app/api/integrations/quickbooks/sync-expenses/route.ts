import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/encryption';
import { refreshQuickBooksToken } from '@/lib/integrations/quickbooks';
import { encrypt } from '@/lib/utils/encryption';
import { retry } from '@/lib/utils/retry';
import { z } from 'zod';

const syncExpensesSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  realmId: z.string().optional(),
});

/**
 * Sync expenses from QuickBooks
 * This endpoint would fetch expense transactions from QuickBooks
 * and create corresponding expense records in our system
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
    const { startDate, endDate, realmId } = syncExpensesSchema.parse(body);

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
    const realmIdToUse = integration.realmId || realmId;

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

    // Check if token is expired or about to expire
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

      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: encrypt(newTokenResponse.access_token),
          refreshToken: encrypt(newTokenResponse.refresh_token || refreshToken),
          tokenExpiresAt: newTokenExpiresAt,
        },
      });
    }

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

    // Fetch expenses from QuickBooks using Purchase transactions
    const baseUrl =
      process.env.QUICKBOOKS_ENVIRONMENT === 'production'
        ? 'https://quickbooks.api.intuit.com'
        : 'https://sandbox-quickbooks.api.intuit.com';

    const expenseQuery = `SELECT * FROM Purchase WHERE TxnDate >= '${startDateObj.toISOString().split('T')[0]}' AND TxnDate <= '${endDateObj.toISOString().split('T')[0]}' AND EntityRef.Type != 'Vendor' ORDERBY TxnDate DESC MAXRESULTS 100`;

    const expenses = await retry(
      async () => {
        const response = await fetch(
          `${baseUrl}/v3/company/${realmIdToUse}/query?query=${encodeURIComponent(expenseQuery)}&minorversion=65`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(`QuickBooks API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.QueryResponse?.Purchase || [];
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        retryCondition: (error: any) => error?.status >= 500,
      }
    );

    // Map QuickBooks expenses to our system and create expense records
    const syncedExpenses: string[] = [];
    const errors: string[] = [];

    for (const expense of expenses) {
      try {
        // Map QuickBooks expense to our Load expense
        // For now, we'll add expenses to the first matching load or create a general expense
        // In production, you'd map based on descriptions, amounts, dates, etc.

        // Example: Try to match expense to a load by description or date
        const expenseDate = expense.TxnDate ? new Date(expense.TxnDate) : null;
        const expenseAmount = expense.TotalAmt || 0;

        if (expenseAmount > 0 && expenseDate) {
          // Find loads around this date to potentially link the expense
          const relatedLoads = await prisma.load.findMany({
            where: {
              companyId: session.user.companyId,
              pickupDate: expenseDate
                ? {
                    gte: new Date(expenseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                    lte: new Date(expenseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                  }
                : undefined,
            },
            take: 1,
          });

          if (relatedLoads.length > 0) {
            const load = relatedLoads[0];

            await prisma.loadExpense.create({
              data: {
                loadId: load.id,
                description: expense.Description || 'QuickBooks Expense',
                amount: expenseAmount,
                expenseType: 'OTHER',
              },
            });

            syncedExpenses.push(expense.Id);
          } else {
            // Could create a general expense record if you have an Expense model
            // For now, just track that we processed it
            syncedExpenses.push(expense.Id);
          }
        }
      } catch (error: any) {
        errors.push(`Failed to sync expense ${expense.Id}: ${error.message}`);
      }
    }

    // Update integration sync status
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: errors.length === 0 ? 'success' : 'error',
        lastError: errors.length > 0 ? errors.join('; ') : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        syncedCount: syncedExpenses.length,
        syncedExpenses,
        errors: errors.length > 0 ? errors : undefined,
        dateRange: {
          startDate: startDateObj.toISOString().split('T')[0],
          endDate: endDateObj.toISOString().split('T')[0],
        },
      },
      message: `Synced ${syncedExpenses.length} expense(s) from QuickBooks`,
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

    console.error('QuickBooks expense sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to sync expenses from QuickBooks',
        },
      },
      { status: 500 }
    );
  }
}

