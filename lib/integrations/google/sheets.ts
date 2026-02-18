import { google } from 'googleapis';

interface SheetsClientConfig {
    serviceAccountEmail?: string;
    serviceAccountPrivateKey?: string;
}

export interface SheetRow {
    [key: string]: string | undefined;
}

export class GoogleSheetsClient {
    private auth: any;
    private sheets: any;
    private config: SheetsClientConfig;

    constructor(config: SheetsClientConfig) {
        this.config = config;
    }

    private _extractSheetId(idOrUrl: string): string {
        const matches = idOrUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (matches && matches[1]) {
            return matches[1];
        }
        return idOrUrl;
    }

    /**
     * Initialize authentication using service account.
     * Tries three strategies in order:
     * 1. GOOGLE_APPLICATION_CREDENTIALS file (production — set by start-with-secrets.js)
     * 2. GoogleAuth with inline credentials object
     * 3. Manual JWT with key cleaning (local dev fallback)
     */
    private async initializeAuth(): Promise<void> {
        if (this.auth) return;

        const { serviceAccountEmail, serviceAccountPrivateKey } = this.config;

        // Strategy 1: GOOGLE_APPLICATION_CREDENTIALS file (preferred for production)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            try {
                const authClient = new google.auth.GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
                });
                await authClient.getClient();
                this.auth = authClient;
                this.sheets = google.sheets({ version: 'v4', auth: this.auth });
                console.log('[GoogleAuth] Authenticated via GOOGLE_APPLICATION_CREDENTIALS');
                return;
            } catch (e) {
                console.warn('[GoogleAuth] GOOGLE_APPLICATION_CREDENTIALS failed:', (e as Error).message);
            }
        }

        if (!serviceAccountEmail || !serviceAccountPrivateKey) {
            throw new Error('Google service account credentials are required');
        }

        // Strategy 2: GoogleAuth with inline credentials object
        try {
            const cleanedKey = this.cleanPrivateKey(serviceAccountPrivateKey);
            const authClient = new google.auth.GoogleAuth({
                credentials: {
                    type: 'service_account' as const,
                    client_email: serviceAccountEmail,
                    private_key: cleanedKey,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            await authClient.getClient();
            this.auth = authClient;
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('[GoogleAuth] Authenticated via inline credentials');
            return;
        } catch (e) {
            console.warn('[GoogleAuth] Inline credentials failed:', (e as Error).message);
        }

        // Strategy 3: Manual JWT (local dev fallback)
        const key = this.cleanPrivateKey(serviceAccountPrivateKey);
        const jwtClient = new google.auth.JWT({
            email: serviceAccountEmail,
            key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        await jwtClient.authorize();
        this.auth = jwtClient;
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        console.log('[GoogleAuth] Authenticated via manual JWT');
    }

    /**
     * Clean a private key string for use with Google auth.
     * Handles JSON service account files, escaped newlines, and quote wrapping.
     */
    private cleanPrivateKey(input: string): string {
        let rawKey = input.trim();

        // Handle JSON format (full service account JSON file)
        if (rawKey.startsWith('{')) {
            try {
                const parsed = JSON.parse(rawKey);
                if (parsed.private_key) rawKey = parsed.private_key;
            } catch {
                // Not valid JSON, continue with raw string
            }
        }

        // Strip surrounding quotes
        if ((rawKey.startsWith('"') && rawKey.endsWith('"')) ||
            (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
            rawKey = rawKey.slice(1, -1);
        }

        // Replace escaped newlines and strip carriage returns
        return rawKey.replace(/\\n/g, '\n').replace(/\r/g, '');
    }

    /**
     * Get the total number of rows in a sheet (excluding header)
     */
    async getRowCount(sheetId: string, sheetName: string = 'Sheet1'): Promise<number> {
        try {
            await this.initializeAuth();

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this._extractSheetId(sheetId),
                range: `${sheetName}!A:A`, // Just get column A to count rows
            });

            const rows = response.data.values || [];
            // Subtract 1 for header row
            return Math.max(0, rows.length - 1);
        } catch (error: any) {
            console.error('Error getting row count:', error);
            throw new Error(`Failed to get row count for Sheet "${sheetName}" (ID: ${sheetId}): ${error.message || 'Unknown error'}. Ensure the sheet is SHARED with the service account.`);
        }
    }

    /**
     * Read a specific range of rows (useful for incremental imports)
     */
    async readSheetRange(
        sheetId: string,
        startRow: number,
        endRow: number,
        sheetName: string = 'Sheet1'
    ): Promise<SheetRow[]> {
        try {
            await this.initializeAuth();

            // Add 1 to account for header row, and add 1 more because Google Sheets is 1-indexed
            // Range is inclusive
            const range = `${sheetName}!A${startRow + 1}:Z${endRow + 1}`;

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this._extractSheetId(sheetId),
                range: range,
            });

            const rows = response.data.values || [];

            if (rows.length === 0) {
                return [];
            }

            // Get headers from first row of full sheet
            const headerResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this._extractSheetId(sheetId),
                range: `${sheetName}!A1:Z1`,
            });

            const headers = (headerResponse.data.values?.[0] || []).map((h: string) =>
                h.replace(/\s+/g, '').replace(/\./g, '_').toLowerCase()
            );

            // Convert rows to objects
            const result: SheetRow[] = [];
            for (const row of rows) {
                const rowObj: SheetRow = {};

                headers.forEach((header: string, index: number) => {
                    rowObj[header] = row[index]?.toString().trim() || undefined;
                });

                // Only add row if it has at least one non-empty value
                if (Object.values(rowObj).some(v => v && v.trim())) {
                    result.push(rowObj);
                }
            }

            return result;
        } catch (error: any) {
            console.error('Error reading Google Sheet range:', error);

            if (error.code === 403) {
                throw new Error('Access denied. Please ensure the Google Sheet is shared with the service account email.');
            }

            if (error.code === 404) {
                throw new Error('Sheet not found. Please check the Sheet ID.');
            }

            throw new Error(`Failed to read Google Sheet: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Test connection to a Google Sheet
     */
    async testConnection(sheetId: string): Promise<{ success: boolean; error?: string; rowCount?: number }> {
        try {
            const rowCount = await this.getRowCount(sheetId);
            return { success: true, rowCount };
        } catch (error: any) {
            return { success: false, error: error.message || 'Connection test failed' };
        }
    }
}

/**
 * Create a Google Sheets client using system credentials (AWS env vars)
 * All companies share the same service account - customers just share their sheets with it
 */
export async function createGoogleSheetsClient(): Promise<GoogleSheetsClient> {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
        throw new Error(
            'Google service account credentials not configured. Contact support to enable Google Sheets integration.'
        );
    }

    return new GoogleSheetsClient({
        serviceAccountEmail,
        serviceAccountPrivateKey,
    });
}

/**
 * Get the service account email for display in UI
 * Customers need this to share their Google Sheets with the service account
 */
export function getGoogleServiceAccountEmail(): string | null {
    return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null;
}
