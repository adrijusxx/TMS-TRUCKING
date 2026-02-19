/**
 * NetSapiens API v2 — Voicemail
 *
 * Read, count, delete, and manage voicemail messages.
 */

import { NSVoicemail } from './types';
import { nsRequest } from './client';

export type VoicemailFolder = 'new' | 'saved' | 'deleted';

/**
 * Get voicemail messages for a user by folder
 */
export async function getVoicemails(
  extension: string,
  folder: VoicemailFolder = 'new',
  companyId?: string
): Promise<NSVoicemail[]> {
  const result = await nsRequest<NSVoicemail[] | { data: NSVoicemail[] }>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/voicemails/${folder}`,
    { method: 'GET' },
    companyId
  );

  if (!result) return [];
  return Array.isArray(result) ? result : result.data || [];
}

/**
 * Get a specific voicemail message (includes audio URL)
 */
export async function getVoicemail(
  extension: string,
  voicemailId: string,
  companyId?: string
): Promise<NSVoicemail | null> {
  return nsRequest<NSVoicemail>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/voicemails/${encodeURIComponent(voicemailId)}`,
    { method: 'GET' },
    companyId
  );
}

/**
 * Count voicemail messages in a folder
 */
export async function countVoicemails(
  extension: string,
  folder: VoicemailFolder = 'new',
  companyId?: string
): Promise<number> {
  const result = await nsRequest<{ count?: number; total?: number }>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/voicemails/${folder}/count`,
    { method: 'GET' },
    companyId
  );

  return result?.count ?? result?.total ?? 0;
}

/**
 * Delete a voicemail message
 */
export async function deleteVoicemail(
  extension: string,
  voicemailId: string,
  companyId?: string
): Promise<boolean> {
  await nsRequest(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/voicemails/${encodeURIComponent(voicemailId)}`,
    { method: 'DELETE' },
    companyId
  );
  return true;
}

/**
 * Move a voicemail to the "saved" folder
 */
export async function saveVoicemail(
  extension: string,
  voicemailId: string,
  companyId?: string
): Promise<boolean> {
  const result = await nsRequest(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/voicemails/${encodeURIComponent(voicemailId)}/save`,
    { method: 'PATCH' },
    companyId
  );
  return result !== null;
}

/**
 * Forward a voicemail to another extension
 */
export async function forwardVoicemail(
  extension: string,
  voicemailId: string,
  targetExtension: string,
  companyId?: string
): Promise<boolean> {
  const result = await nsRequest(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/voicemails/${encodeURIComponent(voicemailId)}/forward`,
    {
      method: 'PATCH',
      body: JSON.stringify({ to: targetExtension }),
    },
    companyId
  );
  return result !== null;
}
