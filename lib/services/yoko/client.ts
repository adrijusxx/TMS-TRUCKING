import { YOKOMOBILE_CONFIG, generateCallId } from './config';
import { prisma } from '@/lib/prisma';

export interface YokoSettings {
    username?: string;
    password?: string;
    answerDevice?: string;
    enabled?: boolean;
}

// In-memory token cache for faster access (per user)
const memoryCache = new Map<string, { token: string; expiresAt: number }>();

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
 * Get bearer token from Yokomobile
 */
async function getBearerToken(userId: string, forceRefresh = false): Promise<string> {
    try {
        const settings = await getUserVoipSettings(userId);

        const username = settings?.username || YOKOMOBILE_CONFIG.username;
        const password = settings?.password || YOKOMOBILE_CONFIG.password;

        if (!username || !password) {
            throw new Error('Yokomobile credentials not configured. Please add them in Profile Settings.');
        }

        // Check memory cache
        if (!forceRefresh) {
            const cached = memoryCache.get(userId);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.token;
            }
        }

        // Fetch new token
        const url = `${YOKOMOBILE_CONFIG.tokenUrl}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        console.log(`[Yoko] Fetching token for user ${userId} (${username})`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error('Invalid credentials. No access token received from Yokomobile.');
        }

        const tokenData = {
            token: data.access_token,
            expiresAt: Date.now() + (19 * 60 * 1000), // 19 minutes
        };

        memoryCache.set(userId, tokenData);
        return data.access_token;

    } catch (error: any) {
        console.error('[Yoko] Token Error:', error);
        memoryCache.delete(userId);
        throw new Error(error.message || 'Failed to authenticate with Yokomobile');
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

        // Fallback to env vars if enabled globally, but usually per-user is preferred
        const username = settings?.username || YOKOMOBILE_CONFIG.username;
        const answerDevice = settings?.answerDevice || YOKOMOBILE_CONFIG.answerDevice;

        if (!username) throw new Error('Yoko username not configured');
        if (!answerDevice) throw new Error('Answer device not configured');

        if (!settings?.enabled) {
            // Optionally allow global override? No, user explicitly requested "settings set for each employee"
            throw new Error('Integration disabled for this user');
        }

        const token = await getBearerToken(userId);
        const callId = generateCallId(username);
        const normalizedDestination = destination.replace(/[^0-9]/g, ''); // Simple normalization

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
            throw new Error(`API Error: ${response.status} ${txt}`);
        }

        return { success: true, callId };

    } catch (error: any) {
        console.error('[Yoko] Call Failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Test Connection
 */
export async function testConnection(userId: string) {
    try {
        await getBearerToken(userId, true);
        return { success: true, message: 'Connection successful!' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
