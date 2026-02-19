/**
 * NetSapiens API v2 — Call Recordings
 *
 * Retrieve call recordings by call ID.
 */

import { NSRecording } from './types';
import { nsRequest, getNSConfig } from './client';

/**
 * Get recording for a specific call (domain-level)
 */
export async function getRecording(
  callId: string,
  companyId?: string
): Promise<NSRecording | null> {
  return nsRequest<NSRecording>(
    `/domains/{domain}/recordings/${encodeURIComponent(callId)}`,
    { method: 'GET' },
    companyId
  );
}

/**
 * Get recording for a specific call (user-level)
 */
export async function getUserRecording(
  extension: string,
  callId: string,
  companyId?: string
): Promise<NSRecording | null> {
  return nsRequest<NSRecording>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/recordings/${encodeURIComponent(callId)}`,
    { method: 'GET' },
    companyId
  );
}

/**
 * Build an authenticated recording URL for client-side audio playback.
 * If the NS API requires auth for recording URLs, we proxy through our API route.
 */
export function getRecordingProxyUrl(callId: string): string {
  return `/api/integrations/netsapiens/recordings/${encodeURIComponent(callId)}`;
}

/**
 * Fetch the raw recording audio as a stream (for proxying to the client)
 */
export async function fetchRecordingStream(
  callId: string,
  companyId?: string
): Promise<Response | null> {
  const config = await getNSConfig(companyId);
  if (!config) return null;

  try {
    const domain = config.domain;
    const url = `${config.baseUrl}/domains/${encodeURIComponent(domain)}/recordings/${encodeURIComponent(callId)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'audio/*',
      },
    });

    if (!response.ok) {
      console.error(`[NetSapiens] Recording fetch failed: ${response.status}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error('[NetSapiens] Recording stream error:', error);
    return null;
  }
}
