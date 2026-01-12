/**
 * Cloudflare Turnstile CAPTCHA Verification Service
 * 
 * Server-side verification of Turnstile tokens for bot protection.
 * Uses Cloudflare's siteverify API endpoint.
 * 
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileVerifyResponse {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
    action?: string;
    cdata?: string;
}

interface VerifyResult {
    success: boolean;
    errorCodes?: string[];
    message?: string;
}

export class TurnstileService {
    private static readonly VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    /**
     * Verify a Turnstile token from the client
     * 
     * @param token - The cf-turnstile-response token from the client widget
     * @param ip - Optional client IP address for additional validation
     * @returns Verification result with success boolean and error info
     */
    static async verify(token: string, ip?: string): Promise<VerifyResult> {
        const secretKey = process.env.TURNSTILE_SECRET_KEY;

        // Return success in development if no secret key configured
        if (!secretKey) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Turnstile] No TURNSTILE_SECRET_KEY configured, skipping verification in development');
                return { success: true, message: 'Verification skipped in development' };
            }
            return {
                success: false,
                message: 'CAPTCHA verification not configured',
                errorCodes: ['missing-secret-key']
            };
        }

        try {
            const formData = new URLSearchParams();
            formData.append('secret', secretKey);
            formData.append('response', token);
            if (ip) {
                formData.append('remoteip', ip);
            }

            const response = await fetch(this.VERIFY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                console.error('[Turnstile] HTTP error:', response.status, response.statusText);
                return {
                    success: false,
                    message: 'Failed to verify CAPTCHA',
                    errorCodes: ['http-error'],
                };
            }

            const data: TurnstileVerifyResponse = await response.json();

            if (data.success) {
                return { success: true };
            }

            // Map error codes to user-friendly messages
            const errorMessages: Record<string, string> = {
                'missing-input-secret': 'Server configuration error',
                'invalid-input-secret': 'Server configuration error',
                'missing-input-response': 'Please complete the CAPTCHA',
                'invalid-input-response': 'CAPTCHA verification failed. Please try again.',
                'bad-request': 'Invalid request',
                'timeout-or-duplicate': 'CAPTCHA expired. Please try again.',
                'internal-error': 'Verification service error',
            };

            const errorCode = data['error-codes']?.[0] || 'unknown';
            return {
                success: false,
                message: errorMessages[errorCode] || 'CAPTCHA verification failed',
                errorCodes: data['error-codes'],
            };
        } catch (error) {
            console.error('[Turnstile] Verification error:', error);
            return {
                success: false,
                message: 'Failed to verify CAPTCHA',
                errorCodes: ['network-error'],
            };
        }
    }

    /**
     * Get the site key for client-side widget rendering
     */
    static getSiteKey(): string | null {
        return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;
    }
}
