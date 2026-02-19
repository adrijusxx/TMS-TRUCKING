/**
 * NetSapiens API v2 — Event Subscriptions
 *
 * Register webhooks for real-time call/SMS/voicemail events.
 */

import { NSSubscription } from './types';
import { nsRequest } from './client';

/**
 * List all event subscriptions
 */
export async function listSubscriptions(companyId?: string): Promise<NSSubscription[]> {
  const result = await nsRequest<NSSubscription[] | { data: NSSubscription[] }>(
    '/subscriptions',
    { method: 'GET' },
    companyId
  );

  if (!result) return [];
  return Array.isArray(result) ? result : result.data || [];
}

/**
 * Get a specific subscription
 */
export async function getSubscription(
  subscriptionId: string,
  companyId?: string
): Promise<NSSubscription | null> {
  return nsRequest<NSSubscription>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'GET' },
    companyId
  );
}

/**
 * Create an event subscription (webhook)
 */
export async function createSubscription(
  event: string,
  targetUrl: string,
  companyId?: string
): Promise<NSSubscription | null> {
  return nsRequest<NSSubscription>(
    '/subscriptions',
    {
      method: 'POST',
      body: JSON.stringify({ event, target_url: targetUrl }),
    },
    companyId
  );
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<NSSubscription>,
  companyId?: string
): Promise<NSSubscription | null> {
  return nsRequest<NSSubscription>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    },
    companyId
  );
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(
  subscriptionId: string,
  companyId?: string
): Promise<boolean> {
  await nsRequest(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'DELETE' },
    companyId
  );
  return true;
}
