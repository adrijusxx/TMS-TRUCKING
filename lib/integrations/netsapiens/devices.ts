/**
 * NetSapiens API v2 — Device Management
 *
 * Query user devices (phones, softphones) on the PBX.
 * Used for softphone discovery and SIP credential probing.
 */

import { nsRequest } from './client';
import { NSDevice } from './types';

/**
 * Get all devices registered to a specific user/extension
 */
export async function getUserDevices(
  extension: string,
  companyId?: string,
): Promise<NSDevice[]> {
  const result = await nsRequest<NSDevice[] | NSDevice>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/devices`,
    { method: 'GET' },
    companyId,
  );

  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

/**
 * Get details for a specific device
 */
export async function getDeviceDetail(
  extension: string,
  device: string,
  companyId?: string,
): Promise<NSDevice | null> {
  return nsRequest<NSDevice>(
    `/domains/{domain}/users/${encodeURIComponent(extension)}/devices/${encodeURIComponent(device)}`,
    { method: 'GET' },
    companyId,
  );
}
