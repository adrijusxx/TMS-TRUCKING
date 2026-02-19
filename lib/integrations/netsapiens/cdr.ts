/**
 * NetSapiens API v2 — CDR (Call Detail Records)
 *
 * Query call history with filtering by date range, user, direction, etc.
 */

import { NSCdr, NSCdrQueryParams, NSPaginatedResponse } from './types';
import { nsRequest } from './client';

/**
 * Get CDRs (call history) for the domain
 */
export async function getCDRs(
  params: NSCdrQueryParams = {},
  companyId?: string
): Promise<{ data: NSCdr[]; total?: number }> {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set('time_start', params.startDate);
  if (params.endDate) searchParams.set('time_release', params.endDate);
  if (params.user) searchParams.set('orig_from_user', params.user);
  if (params.direction) searchParams.set('direction', params.direction);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const qs = searchParams.toString();
  const endpoint = `/domains/{domain}/cdrs${qs ? `?${qs}` : ''}`;

  const result = await nsRequest<NSCdr[] | NSPaginatedResponse<NSCdr>>(
    endpoint,
    { method: 'GET' },
    companyId
  );

  if (!result) return { data: [], total: 0 };

  if (Array.isArray(result)) {
    return { data: result, total: result.length };
  }

  return { data: result.data || [], total: result.total };
}

/**
 * Get CDRs for a specific user/extension
 */
export async function getUserCDRs(
  extension: string,
  params: NSCdrQueryParams = {},
  companyId?: string
): Promise<{ data: NSCdr[]; total?: number }> {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set('time_start', params.startDate);
  if (params.endDate) searchParams.set('time_release', params.endDate);
  if (params.direction) searchParams.set('direction', params.direction);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const qs = searchParams.toString();
  const endpoint = `/domains/{domain}/users/${encodeURIComponent(extension)}/cdrs${qs ? `?${qs}` : ''}`;

  const result = await nsRequest<NSCdr[] | NSPaginatedResponse<NSCdr>>(
    endpoint,
    { method: 'GET' },
    companyId
  );

  if (!result) return { data: [], total: 0 };

  if (Array.isArray(result)) {
    return { data: result, total: result.length };
  }

  return { data: result.data || [], total: result.total };
}

/**
 * Get CDR count for the domain (useful for pagination)
 */
export async function getCDRCount(
  params: NSCdrQueryParams = {},
  companyId?: string
): Promise<number> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set('time_start', params.startDate);
  if (params.endDate) searchParams.set('time_release', params.endDate);
  if (params.user) searchParams.set('orig_from_user', params.user);
  if (params.direction) searchParams.set('direction', params.direction);

  const qs = searchParams.toString();
  const endpoint = `/domains/{domain}/cdrs/count${qs ? `?${qs}` : ''}`;

  const result = await nsRequest<{ count?: number; total?: number }>(
    endpoint,
    { method: 'GET' },
    companyId
  );

  return result?.count ?? result?.total ?? 0;
}
