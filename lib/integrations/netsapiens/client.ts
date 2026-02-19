/**
 * NetSapiens API v2 Client
 *
 * Core request logic, config retrieval, and domain auto-discovery.
 * Follows the Samsara client pattern (lib/integrations/samsara/client.ts).
 *
 * Auth: Bearer API Key (company-level, no expiration)
 * Base URL: https://{server}/ns-api/v2
 */

import { NSConfig, NSDomain, NSApiError } from './types';

// In-memory domain cache to avoid repeated lookups
let cachedDomain: { domain: string; companyId: string; expiresAt: number } | null = null;
const DOMAIN_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get NetSapiens configuration from ApiKeyService or environment
 */
export async function getNSConfig(companyId?: string): Promise<NSConfig | null> {
  const { ApiKeyService } = await import('@/lib/services/ApiKeyService');

  // 1. Get API key (hierarchical: MC → Company → Global → env)
  let apiKey: string | null = null;
  try {
    apiKey = await ApiKeyService.getCredential('NETSAPIENS', 'API_KEY', { companyId });
  } catch (error) {
    console.debug('[NetSapiens] Hierarchical API key lookup failed:', error);
  }
  if (!apiKey) {
    apiKey = process.env.NS_API_KEY || null;
  }
  if (!apiKey) {
    console.warn('[NetSapiens] API key not configured');
    return null;
  }

  // 2. Get server URL
  let server: string | null = null;
  try {
    server = await ApiKeyService.getCredential('NETSAPIENS', 'SERVER', { companyId });
  } catch { /* ignore */ }
  if (!server) {
    server = process.env.NS_API_SERVER || null;
  }
  if (!server) {
    console.warn('[NetSapiens] Server not configured');
    return null;
  }

  // 3. Get domain (cached → DB → auto-discover)
  const domain = await resolveDomain(apiKey, server, companyId);
  if (!domain) {
    console.warn('[NetSapiens] Could not resolve domain');
    return null;
  }

  const baseUrl = `https://${server}/ns-api/v2`;
  return { apiKey, baseUrl, domain };
}

/**
 * Resolve the PBX domain: memory cache → ApiKeyConfig → auto-discover
 */
async function resolveDomain(
  apiKey: string,
  server: string,
  companyId?: string
): Promise<string | null> {
  // 1. Memory cache
  if (cachedDomain && cachedDomain.companyId === (companyId || '') && cachedDomain.expiresAt > Date.now()) {
    return cachedDomain.domain;
  }

  // 2. Database cache
  const { ApiKeyService } = await import('@/lib/services/ApiKeyService');
  try {
    const stored = await ApiKeyService.getCredential('NETSAPIENS', 'DOMAIN', { companyId });
    if (stored) {
      cachedDomain = { domain: stored, companyId: companyId || '', expiresAt: Date.now() + DOMAIN_CACHE_TTL };
      return stored;
    }
  } catch { /* ignore */ }

  // 3. Auto-discover via API
  const discovered = await discoverDomain(apiKey, server);
  if (discovered && companyId) {
    // Cache to DB
    try {
      await ApiKeyService.setCredential({
        provider: 'NETSAPIENS',
        configKey: 'DOMAIN',
        configValue: discovered,
        scope: 'COMPANY' as any,
        companyId,
        description: 'Auto-discovered PBX domain',
      });
    } catch (e) {
      console.warn('[NetSapiens] Failed to cache domain to DB:', e);
    }
  }

  if (discovered) {
    cachedDomain = { domain: discovered, companyId: companyId || '', expiresAt: Date.now() + DOMAIN_CACHE_TTL };
  }

  return discovered;
}

/**
 * Auto-discover the PBX domain via GET /domains/~
 */
export async function discoverDomain(apiKey: string, server: string): Promise<string | null> {
  try {
    const baseUrl = `https://${server}/ns-api/v2`;
    const response = await fetch(`${baseUrl}/domains/~`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.error(`[NetSapiens] Domain discovery failed: ${response.status}`);
      return null;
    }

    const data = await response.json() as NSDomain | NSDomain[];
    // API may return a single domain or an array
    const domain = Array.isArray(data) ? data[0]?.domain : data?.domain;
    if (domain) {
      console.log(`[NetSapiens] Domain discovered: ${domain}`);
    }
    return domain || null;
  } catch (error) {
    console.error('[NetSapiens] Domain discovery error:', error);
    return null;
  }
}

/**
 * Make an authenticated request to the NetSapiens API v2
 */
export async function nsRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  companyId?: string
): Promise<T | null> {
  const config = await getNSConfig(companyId);
  if (!config) {
    console.warn('[NetSapiens] API not configured');
    return null;
  }

  return nsRequestWithConfig<T>(endpoint, config, options);
}

/**
 * Make an authenticated request using a provided config (avoids re-fetching config)
 */
export async function nsRequestWithConfig<T>(
  endpoint: string,
  config: NSConfig,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    // Replace {domain} placeholder with actual domain
    const resolvedEndpoint = endpoint.replace(/\{domain\}/g, encodeURIComponent(config.domain));
    const url = `${config.baseUrl}${resolvedEndpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error(`[NetSapiens] Authentication failed for: ${endpoint}`);
        return null;
      }
      if (response.status === 403) {
        console.error(`[NetSapiens] Access forbidden for: ${endpoint}`);
        return null;
      }
      if (response.status === 404) {
        console.debug(`[NetSapiens] Not found: ${endpoint}`);
        return null;
      }

      const error = await response.json().catch(() => ({ message: response.statusText })) as NSApiError;
      console.error(`[NetSapiens] API error (${response.status}):`, error.message || error.error);
      return null;
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[NetSapiens] Request error:', error);
    return null;
  }
}

/**
 * Clear the in-memory domain cache (for testing / reconfiguration)
 */
export function clearNSCache(): void {
  cachedDomain = null;
}
