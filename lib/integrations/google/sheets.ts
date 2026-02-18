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
     * Initialize authentication using service account
     */
    private async initializeAuth(): Promise<void> {
        if (this.auth) return;

        const { serviceAccountEmail, serviceAccountPrivateKey } = this.config;
        if (!serviceAccountEmail || !serviceAccountPrivateKey) {
            throw new Error('Google service account credentials are required');
        }

        let rawKey = serviceAccountPrivateKey.trim();

        // STRATEGY 0: Handle JSON format (full service account JSON file)
        if (rawKey.startsWith('{')) {
            try {
                const parsed = JSON.parse(rawKey);
                if (parsed.private_key) rawKey = parsed.private_key;
            } catch {
                console.error('[GoogleAuth] JSON start detected but parsing failed.');
            }
        }

        // Strip surrounding quotes
        if ((rawKey.startsWith('"') && rawKey.endsWith('"')) ||
            (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
            rawKey = rawKey.slice(1, -1);
        }

        // Build key variants to try in order
        const keyStrategies = this.buildKeyStrategies(rawKey);
        let lastError: any;

        for (let i = 0; i < keyStrategies.length; i++) {
            try {
                const key = keyStrategies[i]();
                const authClient = new google.auth.JWT({
                    email: serviceAccountEmail,
                    key,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
                });
                await authClient.authorize();
                this.auth = authClient;
                this.sheets = google.sheets({ version: 'v4', auth: this.auth });
                return;
            } catch (error: any) {
                lastError = error;
                console.error(`[GoogleAuth] Strategy ${i + 1} failed:`, error.message);
            }
        }

        // All strategies failed — log debug info
        console.error('[GoogleAuth DEBUG] All strategies failed. Key stats:', {
            length: serviceAccountPrivateKey.length,
            startsWithQuote: serviceAccountPrivateKey.startsWith('"'),
            startsWithBrace: serviceAccountPrivateKey.startsWith('{'),
            hasEscapedNewline: serviceAccountPrivateKey.includes('\\n'),
            hasRealNewline: serviceAccountPrivateKey.includes('\n'),
            hasCarriageReturn: serviceAccountPrivateKey.includes('\r'),
        });

        throw new Error(
            `Failed to initialize Google authentication: ${lastError?.message || 'Invalid credentials'}`
        );
    }

    /**
     * Build an ordered list of key-normalization strategies
     */
    private buildKeyStrategies(rawKey: string): Array<() => string> {
        return [
            // Strategy 1: Replace escaped newlines, strip \r (Windows CRLF)
            () => {
                const key = rawKey.replace(/\\n/g, '\n').replace(/\r/g, '');
                if (!key.includes('BEGIN PRIVATE KEY') && !key.includes('BEGIN RSA PRIVATE KEY')) {
                    throw new Error('Missing PEM markers');
                }
                return key;
            },
            // Strategy 2: Robust reconstruction — strip everything and rebuild PEM
            () => {
                const base64Only = rawKey
                    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
                    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
                    .replace(/\\n/g, '')
                    .replace(/[\s\r\n"']/g, '');

                const chunked = base64Only.match(/.{1,64}/g)?.join('\n');
                return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----\n`;
            },
            // Strategy 3: Same reconstruction but as RSA PRIVATE KEY (PKCS#1)
            () => {
                const base64Only = rawKey
                    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
                    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
                    .replace(/\\n/g, '')
                    .replace(/[\s\r\n"']/g, '');

                const chunked = base64Only.match(/.{1,64}/g)?.join('\n');
                return `-----BEGIN RSA PRIVATE KEY-----\n${chunked}\n-----END RSA PRIVATE KEY-----\n`;
            },
        ];
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
