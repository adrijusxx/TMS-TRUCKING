/**
 * Telegram utility functions
 * Extracted to keep TelegramMessageProcessor under file-size limits.
 */

/**
 * Normalize a phone number by stripping all non-digit characters.
 * Strips leading '1' for US numbers (11 digits starting with 1).
 */
export function normalizePhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    // Strip US country code
    if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
    return digits;
}

/**
 * Check if message text contains any emergency keywords (case-insensitive word boundary match).
 */
export function checkEmergencyKeywords(messageText: string, keywords: string[]): boolean {
    if (!keywords || keywords.length === 0) return false;
    const lowerText = messageText.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
}

/**
 * Check if current time falls within the configured business hours for the given timezone.
 * Returns `true` when inside business hours (or on parse failure — fail-open).
 */
export function isWithinBusinessHours(
    startTime: string,
    endTime: string,
    timezone: string,
): boolean {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
        const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
        const currentMinutes = currentHour * 60 + currentMinute;

        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startMinutes = startH * 60 + (startM || 0);
        const endMinutes = endH * 60 + (endM || 0);

        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } catch {
        console.warn('[Telegram] Failed to check business hours, defaulting to within-hours');
        return true;
    }
}
