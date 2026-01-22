import { YOKOMOBILE_CONFIG, generateCallId } from './config';
import { prisma } from '@/lib/prisma';

export interface YokoSettings {
    username?: string;
    password?: string;
    answerDevice?: string;
    enabled?: boolean;
    // Cached token
    cachedToken?: string;
    tokenExpiresAt?: number;
}

// In-memory token cache for faster access (per user)
const memoryCache = new Map<string, { token: string; expiresAt: number }>();

// Known Yoko error messages and user-friendly translations
const FRIENDLY_ERRORS: Record<string, string> = {
    'Token generation error': 'Yoko server is having issues. Please try again later or contact Yoko support.',
    '500 Internal Server Error': 'Yoko API is temporarily unavailable. Your credentials are likely correct - please wait and try again.',
    'Invalid credentials': 'Username or password is incorrect. Check your Yoko settings.',
    'Failed to get token': 'Could not connect to Yoko. Their server may be down.',
};

/**
 * Convert technical errors to user-friendly messages
 */
function friendlyError(error: string): string {
    for (const [key, friendly] of Object.entries(FRIENDLY_ERRORS)) {
        if (error.includes(key)) {
            return friendly;
        }
    }
    return error;
}

/**
 * Get internal settings from User profile
 */
async function getUserVoipSettings(userId: string): Promise<YokoSettings | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { voipConfig: true }
    });

    if (!user?.voipConfig) return null;
    return user.voipConfig as YokoSettings;
}

/**
 * Save token to user's voipConfig for persistence
 */
async function saveTokenToDb(userId: string, token: string, expiresAt: number): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { voipConfig: true }
        });

        const currentConfig = (user?.voipConfig as YokoSettings) || {};

        await prisma.user.update({
            where: { id: userId },
            data: {
                voipConfig: {
                    ...currentConfig,
                    cachedToken: token,
                    tokenExpiresAt: expiresAt
                }
            }
        });
        console.log('[Yoko] Token cached to database');
    } catch (e) {
        console.warn('[Yoko] Failed to cache token to db:', e);
    }
}

/**
 * Get bearer token from Yokomobile
 */
async function getBearerToken(userId: string, forceRefresh = false): Promise<string> {
    try {
        const settings = await getUserVoipSettings(userId);

        const username = settings?.username || YOKOMOBILE_CONFIG.username;
        const password = settings?.password || YOKOMOBILE_CONFIG.password;

        if (!username || !password) {
            throw new Error('Yoko credentials not configured. Go to Profile Settings to add your Yoko login.');
        }

        // Check memory cache first
        if (!forceRefresh) {
            const cached = memoryCache.get(userId);
            if (cached && cached.expiresAt > Date.now()) {
                console.log('[Yoko] Using memory-cached token');
                return cached.token;
            }

            // Check database-cached token
            if (settings?.cachedToken && settings?.tokenExpiresAt && settings.tokenExpiresAt > Date.now()) {
                console.log('[Yoko] Using DB-cached token');
                memoryCache.set(userId, { token: settings.cachedToken, expiresAt: settings.tokenExpiresAt });
                return settings.cachedToken;
            }
        }

        // Fetch new token
        const url = `${YOKOMOBILE_CONFIG.tokenUrl}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        console.log(`[Yoko] Fetching new token for user ${userId} (${username})`);

        const response = await fetch(url);

        if (!response.ok) {
            let errorBody = '';
            try {
                errorBody = await response.text();
                // Check for known error patterns
                if (errorBody.includes('Token generation error')) {
                    throw new Error('Yoko server error: Token generation failed. This is a Yoko server issue - please try again later.');
                }
            } catch (e) {
                if (e instanceof Error && e.message.includes('Yoko server')) throw e;
            }
            throw new Error(`Yoko API error (${response.status}). Their server may be temporarily down.`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error('Invalid response from Yoko - no token received. Check your credentials.');
        }

        // Cache token (19 minutes to be safe, Yoko expires at 20)
        const expiresAt = Date.now() + (19 * 60 * 1000);
        const tokenData = { token: data.access_token, expiresAt };

        // Store in memory
        memoryCache.set(userId, tokenData);

        // Store in database for persistence across restarts
        await saveTokenToDb(userId, data.access_token, expiresAt);

        console.log('[Yoko] Token fetched and cached successfully');
        return data.access_token;

    } catch (error: any) {
        console.error('[Yoko] Token Error:', error.message);
        memoryCache.delete(userId);
        throw new Error(friendlyError(error.message));
    }
}

/**
 * Make a call via Yokomobile
 */
export async function makeCall(
    userId: string,
    destination: string
): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
        const settings = await getUserVoipSettings(userId);

        const username = settings?.username || YOKOMOBILE_CONFIG.username;
        const answerDevice = settings?.answerDevice || YOKOMOBILE_CONFIG.answerDevice;

        if (!username) {
            return { success: false, error: 'Yoko username not configured. Go to Profile Settings → Yoko to configure.' };
        }
        if (!answerDevice) {
            return { success: false, error: 'Answer device not set. Go to Profile Settings → Yoko and add your phone number.' };
        }
        if (!settings?.enabled) {
            return { success: false, error: 'Yoko is disabled. Enable it in Profile Settings → Yoko.' };
        }

        const token = await getBearerToken(userId);
        const callId = generateCallId(username);
        const normalizedDestination = destination.replace(/[^0-9]/g, '');

        console.log(`[Yoko] Initiating call ${callId} to ${normalizedDestination} via ${answerDevice}`);

        const formData = new FormData();
        formData.append('object', 'call');
        formData.append('action', 'call');
        formData.append('callid', callId);
        formData.append('uid', username);
        formData.append('auto', 'yes');
        formData.append('destination', normalizedDestination);
        formData.append('cbani', normalizedDestination);
        formData.append('origination', answerDevice);

        const response = await fetch(YOKOMOBILE_CONFIG.callEndpoint, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) {
            const txt = await response.text();
            console.error('[Yoko] Call API Error:', txt);

            // If token might be expired, clear cache and suggest retry
            if (response.status === 401) {
                memoryCache.delete(userId);
                return { success: false, error: 'Session expired. Please try again.' };
            }

            return { success: false, error: `Call failed: ${response.status}. Please try again.` };
        }

        console.log('[Yoko] Call initiated successfully');
        return { success: true, callId };

    } catch (error: any) {
        console.error('[Yoko] Call Failed:', error.message);
        return { success: false, error: friendlyError(error.message) };
    }
}

/**
 * Test Connection - provides user-friendly feedback
 */
export async function testConnection(userId: string): Promise<{ success: boolean; message: string }> {
    try {
        await getBearerToken(userId, true);
        return { success: true, message: 'Connected successfully! Yoko is ready for calls.' };
    } catch (e: any) {
        return { success: false, message: friendlyError(e.message) };
    }
}

/**
 * Clear cached token (for troubleshooting)
 */
export async function clearTokenCache(userId: string): Promise<void> {
    memoryCache.delete(userId);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { voipConfig: true }
    });

    if (user?.voipConfig) {
        const config = user.voipConfig as YokoSettings;
        await prisma.user.update({
            where: { id: userId },
            data: {
                voipConfig: {
                    ...config,
                    cachedToken: undefined,
                    tokenExpiresAt: undefined
                }
            }
        });
    }
    console.log('[Yoko] Token cache cleared');
}
