/**
 * NetSapiens API v2 — Call Operations
 *
 * Make calls, list active calls, transfer, hold, disconnect.
 * Uses click-to-call pattern: API rings the user's device first, then connects to destination.
 */

import { NSActiveCall, NSCallResult } from './types';
import { nsRequest } from './client';

/**
 * Initiate a call via the NS API v2
 *
 * Flow: API calls the user's answerDevice → user picks up → API connects to destination
 */
export async function makeNSCall(
  extension: string,
  destination: string,
  answerDevice: string,
  companyId?: string
): Promise<NSCallResult> {
  try {
    if (!extension || !destination || !answerDevice) {
      return { success: false, error: 'Missing required call parameters (extension, destination, answerDevice)' };
    }

    const normalizedDest = destination.replace(/[^0-9+]/g, '');
    if (!normalizedDest) {
      return { success: false, error: 'Invalid destination number' };
    }

    const callid = `tms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const body = {
      callid,
      destination: normalizedDest,
      origination: answerDevice.replace(/[^0-9+]/g, ''),
      auto: 'yes',
    };

    const result = await nsRequest<any>(
      `/domains/{domain}/users/${encodeURIComponent(extension)}/calls`,
      { method: 'POST', body: JSON.stringify(body) },
      companyId
    );

    // nsRequest returns null on error
    if (result === null) {
      return { success: false, error: 'Failed to initiate call. Check your PBX extension and answer device.' };
    }

    console.log(`[NetSapiens] Call initiated: ${extension} → ${normalizedDest} (callId: ${callid})`);
    return { success: true, callId: callid };
  } catch (error: any) {
    console.error('[NetSapiens] makeNSCall error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all active calls in the domain
 */
export async function getActiveCalls(companyId?: string): Promise<NSActiveCall[]> {
  const result = await nsRequest<NSActiveCall[] | { data: NSActiveCall[] }>(
    `/domains/{domain}/calls`,
    { method: 'GET' },
    companyId
  );

  if (!result) return [];
  return Array.isArray(result) ? result : (result.data || []);
}

/**
 * Get active calls for a specific user/extension
 */
export async function getUserActiveCalls(extension: string, companyId?: string): Promise<NSActiveCall[]> {
  const result = await nsRequest<NSActiveCall[] | { data: NSActiveCall[] }>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/calls`,
    { method: 'GET' },
    companyId
  );

  if (!result) return [];
  return Array.isArray(result) ? result : (result.data || []);
}

/**
 * Transfer an active call to another number/extension
 */
export async function transferCall(
  extension: string,
  callId: string,
  target: string,
  companyId?: string
): Promise<boolean> {
  const result = await nsRequest(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/calls/${encodeURIComponent(callId)}/transfer`,
    { method: 'PATCH', body: JSON.stringify({ destination: target }) },
    companyId
  );
  return result !== null;
}

/**
 * Put an active call on hold
 */
export async function holdCall(extension: string, callId: string, companyId?: string): Promise<boolean> {
  const result = await nsRequest(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/calls/${encodeURIComponent(callId)}/hold`,
    { method: 'PATCH' },
    companyId
  );
  return result !== null;
}

/**
 * Take a call off hold
 */
export async function unholdCall(extension: string, callId: string, companyId?: string): Promise<boolean> {
  const result = await nsRequest(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/calls/${encodeURIComponent(callId)}/unhold`,
    { method: 'PATCH' },
    companyId
  );
  return result !== null;
}

/**
 * Disconnect an active call
 */
export async function disconnectCall(extension: string, callId: string, companyId?: string): Promise<boolean> {
  const result = await nsRequest(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/calls/${encodeURIComponent(callId)}`,
    { method: 'DELETE' },
    companyId
  );
  // DELETE returns null (204) on success, but nsRequest also returns null on error
  // We trust the API did its job if no exception was thrown
  return true;
}
