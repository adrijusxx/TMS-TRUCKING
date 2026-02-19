/**
 * NetSapiens API v2 — SMS Messaging
 *
 * Endpoint: POST /domains/{domain}/users/{user}/messages
 * Required body: { type: "sms", destination, from_num, message }
 * Note: from_num must be an SMS-enabled number assigned to the user in the PBX.
 */

import { NSSmsMessage, NSMessageSession } from './types';
import { nsRequest } from './client';

/**
 * Send an SMS message via NetSapiens API v2
 *
 * @param userExtension - PBX extension of the sending user (e.g. "101")
 * @param to - Destination phone number
 * @param message - SMS text content
 * @param companyId - Company ID for config lookup
 * @param fromNumber - Optional override for from_num (SMS-enabled number).
 *                     If not provided, auto-resolves from user's SMS numbers.
 */
export async function sendSMS(
  userExtension: string,
  to: string,
  message: string,
  companyId?: string,
  fromNumber?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userExtension || !to || !message) {
      return { success: false, error: 'Extension, destination, and message are required' };
    }

    const normalizedTo = to.replace(/[^0-9+]/g, '');
    const ext = userExtension.replace(/[^0-9]/g, '');

    // Resolve SMS-enabled from number (user's own number only — no fallback)
    let smsFrom = fromNumber?.replace(/[^0-9+]/g, '');

    if (!smsFrom) {
      const userSmsNumbers = await getUserSmsNumbers(ext, companyId);
      if (userSmsNumbers.length > 0) {
        smsFrom = userSmsNumbers[0];
      }
    }

    if (!smsFrom) {
      return {
        success: false,
        error: 'No SMS number assigned to your extension. Contact your admin to assign one.',
      };
    }

    const result = await nsRequest<any>(
      `/domains/{domain}/users/${encodeURIComponent(ext)}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'sms',
          destination: normalizedTo,
          from_num: smsFrom,
          message,
        }),
      },
      companyId
    );

    if (result === null) {
      return { success: false, error: 'Failed to send SMS. Check your PBX SMS configuration.' };
    }

    console.log(`[NetSapiens] SMS sent: ${smsFrom} → ${normalizedTo}`);
    return { success: true };
  } catch (error: any) {
    console.error('[NetSapiens] sendSMS error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get SMS-enabled numbers assigned to a specific user
 */
async function getUserSmsNumbers(extension: string, companyId?: string): Promise<string[]> {
  const result = await nsRequest<any[]>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/smsnumbers`,
    { method: 'GET' },
    companyId
  );
  if (!result || !Array.isArray(result)) return [];
  return result.map((n: any) => n.number || n.dest || n['phone-number'] || '').filter(Boolean);
}

/**
 * Get SMS-enabled numbers for the entire domain
 */
async function getDomainSmsNumbers(companyId?: string): Promise<string[]> {
  const numbers = await getDomainSmsNumbersWithOwner(companyId);
  return numbers.map(n => n.number);
}

async function getDomainSmsNumbersWithOwner(
  companyId?: string
): Promise<{ number: string; dest: string }[]> {
  const result = await nsRequest<any[]>(
    `/domains/{domain}/smsnumbers?domain={domain}&dest=*`,
    { method: 'GET' },
    companyId
  );
  if (!result || !Array.isArray(result)) return [];
  return result
    .filter((n: any) => n.number && n.dest)
    .map((n: any) => ({ number: n.number, dest: n.dest }));
}

/**
 * Send a group SMS to multiple destinations
 */
export async function sendGroupSMS(
  userExtension: string,
  to: string[],
  message: string,
  companyId?: string,
  fromNumber?: string,
): Promise<{ success: boolean; error?: string }> {
  // Send individually — NS API v2 doesn't have a native group SMS POST
  const results = await Promise.allSettled(
    to.map(dest => sendSMS(userExtension, dest, message, companyId, fromNumber))
  );
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
  if (failed.length === to.length) {
    return { success: false, error: 'All SMS sends failed' };
  }
  return { success: true };
}

/**
 * Get message sessions for a user
 */
export async function getMessageSessions(
  extension: string,
  companyId?: string
): Promise<NSMessageSession[]> {
  const result = await nsRequest<NSMessageSession[] | { data: NSMessageSession[] }>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/messagesessions`,
    { method: 'GET' },
    companyId
  );

  if (!result) return [];
  return Array.isArray(result) ? result : result.data || [];
}

/**
 * Get messages within a session
 */
export async function getSessionMessages(
  extension: string,
  sessionId: string,
  companyId?: string
): Promise<any[]> {
  const result = await nsRequest<any[] | { data: any[] }>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/messagesessions/${encodeURIComponent(sessionId)}/messages`,
    { method: 'GET' },
    companyId
  );

  if (!result) return [];
  return Array.isArray(result) ? result : result.data || [];
}

/**
 * Get SMS-enabled numbers for the domain (public export)
 */
export async function getSmsNumbers(companyId?: string): Promise<string[]> {
  return getDomainSmsNumbers(companyId);
}
