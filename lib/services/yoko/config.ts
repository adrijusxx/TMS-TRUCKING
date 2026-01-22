/**
 * Yokomobile configuration and constants
 * Based on Yoko Networks Chrome extension API
 */

export const YOKOMOBILE_CONFIG = {
    // Authentication
    tokenUrl: 'https://portal.yoko.us/getbearertoken',

    // API endpoints
    apiBaseUrl: 'https://core2-chi.yokopbx.com/ns-api/',
    callEndpoint: 'https://core2-chi.yokopbx.com/ns-api/?object=call&action=call',

    // Token refresh interval (20 minutes as per extension)
    tokenRefreshInterval: 20 * 60 * 1000, // 20 minutes in milliseconds

    // Optional fallback credentials from environment (per-user settings take priority)
    username: process.env.YOKOMOBILE_USERNAME,
    password: process.env.YOKOMOBILE_PASSWORD,
    answerDevice: process.env.YOKOMOBILE_ANSWER_DEVICE,
};

/**
 * Generate unique call ID
 * Format: {username}_{timestamp}{random}
 */
export function generateCallId(username: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `${username}_${timestamp}${random}`;
}
