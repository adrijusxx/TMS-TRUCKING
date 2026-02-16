/**
 * QuickBooks Integration
 * 
 * This module provides functions for integrating with QuickBooks API:
 * - OAuth authentication
 * - Invoice sync to QuickBooks
 * - Expense sync from QuickBooks
 * 
 * Note: Requires QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET environment variables
 */

interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  redirectUri: string;
}

interface QuickBooksTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface QuickBooksInvoice {
  Id?: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  Line?: Array<{
    Amount: number;
    Description?: string;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: { value: string; name: string };
      Qty: number;
      UnitPrice: number;
    };
  }>;
  CustomerRef?: { value: string; name: string };
  TotalAmt: number;
  Balance?: number;
}

/**
 * Get QuickBooks configuration from environment variables
 * 
 * In production on AWS, these values are loaded from AWS Secrets Manager
 * via initialization at application startup.
 * @see lib/secrets/initialize.ts
 */
export function getQuickBooksConfig(): QuickBooksConfig | null {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  if (!clientId || !clientSecret) {
    console.warn('QuickBooks API credentials not configured');
    return null;
  }

  const baseUrl = environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  return {
    clientId,
    clientSecret,
    environment,
    redirectUri: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/integrations/quickbooks/callback`
      : 'http://localhost:3000/api/integrations/quickbooks/callback',
  };
}

/**
 * Generate QuickBooks OAuth authorization URL
 */
export function getQuickBooksAuthUrl(state?: string): string | null {
  const config = getQuickBooksConfig();
  if (!config) return null;

  const scope = 'com.intuit.quickbooks.accounting';
  const responseType = 'code';
  const baseUrl = config.environment === 'production'
    ? 'https://appcenter.intuit.com/connect/oauth2'
    : 'https://appcenter.intuit.com/connect/oauth2';

  const params = new URLSearchParams({
    client_id: config.clientId,
    scope,
    redirect_uri: config.redirectUri,
    response_type: responseType,
    access_type: 'offline',
    ...(state && { state }),
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeQuickBooksCode(
  code: string,
  realmId: string
): Promise<QuickBooksTokenResponse | null> {
  const config = getQuickBooksConfig();
  if (!config) return null;

  try {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`QuickBooks token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('QuickBooks token exchange error:', error);
    return null;
  }
}

/**
 * Refresh QuickBooks access token
 */
export async function refreshQuickBooksToken(
  refreshToken: string
): Promise<QuickBooksTokenResponse | null> {
  const config = getQuickBooksConfig();
  if (!config) return null;

  try {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`QuickBooks token refresh failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('QuickBooks token refresh error:', error);
    return null;
  }
}

/**
 * Create invoice in QuickBooks
 */
export async function createQuickBooksInvoice(
  accessToken: string,
  realmId: string,
  invoice: QuickBooksInvoice
): Promise<QuickBooksInvoice | null> {
  const config = getQuickBooksConfig();
  if (!config) return null;

  const baseUrl = config.environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  try {
    const response = await fetch(`${baseUrl}/v3/company/${realmId}/invoice?minorversion=65`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`QuickBooks invoice creation failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.QueryResponse?.Invoice?.[0] || data.Invoice || null;
  } catch (error) {
    console.error('QuickBooks invoice creation error:', error);
    return null;
  }
}

/**
 * Get customer from QuickBooks
 */
async function getQuickBooksCustomer(
  accessToken: string,
  realmId: string,
  customerId: string
): Promise<any | null> {
  const config = getQuickBooksConfig();
  if (!config) return null;

  const baseUrl = config.environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  try {
    const response = await fetch(
      `${baseUrl}/v3/company/${realmId}/query?query=select * from Customer where Id='${customerId}'&minorversion=65`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`QuickBooks customer fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.QueryResponse?.Customer?.[0] || null;
  } catch (error) {
    console.error('QuickBooks customer fetch error:', error);
    return null;
  }
}

/**
 * Sync invoice to QuickBooks (high-level function)
 * TODO: Implement full invoice sync logic with company credentials
 */
export async function syncInvoiceToQuickBooks(
  companyId: string,
  invoiceId: string
): Promise<string | null> {
  // TODO: Implement
  // 1. Get company's QuickBooks credentials from DB
  // 2. Fetch invoice with all details
  // 3. Transform to QuickBooks format
  // 4. Call createQuickBooksInvoice
  console.warn('syncInvoiceToQuickBooks not fully implemented');
  return null;
}

/**
 * Sync customer to QuickBooks (high-level function)
 * TODO: Implement full customer sync logic with company credentials
 */
export async function syncCustomerToQuickBooks(
  companyId: string,
  customerId: string
): Promise<string | null> {
  // TODO: Implement
  // 1. Get company's QuickBooks credentials from DB
  // 2. Fetch customer details
  // 3. Transform to QuickBooks format
  // 4. Create customer in QuickBooks
  console.warn('syncCustomerToQuickBooks not fully implemented');
  return null;
}