/**
 * NetSapiens API v2 — Contacts
 *
 * Shared (domain-level) contact CRUD and sync from TMS entities.
 */

import { NSContact } from './types';
import { nsRequest } from './client';

/**
 * Get shared contacts for the domain
 */
export async function getNSContacts(companyId?: string): Promise<NSContact[]> {
  const result = await nsRequest<NSContact[] | { data: NSContact[] }>(
    '/domains/{domain}/contacts',
    { method: 'GET' },
    companyId
  );

  if (!result) return [];
  return Array.isArray(result) ? result : result.data || [];
}

/**
 * Get a specific shared contact
 */
export async function getNSContact(
  contactId: string,
  companyId?: string
): Promise<NSContact | null> {
  return nsRequest<NSContact>(
    `/domains/{domain}/contacts/${encodeURIComponent(contactId)}`,
    { method: 'GET' },
    companyId
  );
}

/**
 * Create a shared contact on the PBX
 */
export async function createNSContact(
  contact: Omit<NSContact, 'id'>,
  companyId?: string
): Promise<NSContact | null> {
  return nsRequest<NSContact>(
    '/domains/{domain}/contacts',
    {
      method: 'POST',
      body: JSON.stringify(contact),
    },
    companyId
  );
}

/**
 * Update a shared contact
 */
export async function updateNSContact(
  contactId: string,
  contact: Partial<NSContact>,
  companyId?: string
): Promise<NSContact | null> {
  return nsRequest<NSContact>(
    `/domains/{domain}/contacts/${encodeURIComponent(contactId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(contact),
    },
    companyId
  );
}

/**
 * Delete a shared contact
 */
export async function deleteNSContact(
  contactId: string,
  companyId?: string
): Promise<boolean> {
  await nsRequest(
    `/domains/{domain}/contacts/${encodeURIComponent(contactId)}`,
    { method: 'DELETE' },
    companyId
  );
  return true;
}

/**
 * Sync TMS customers and drivers to the PBX shared contacts.
 * Returns the count of synced contacts and any errors.
 */
export async function syncContactsToNS(
  companyId: string
): Promise<{ synced: number; errors: string[] }> {
  const { prisma } = await import('@/lib/prisma');
  const errors: string[] = [];
  let synced = 0;

  // Fetch customers with phone numbers
  const customers = await prisma.customer.findMany({
    where: {
      companyId,
      deletedAt: null,
      phone: { not: '' },
    },
    select: { id: true, name: true, phone: true, email: true },
    take: 500,
  });

  // Fetch drivers via user relation (Driver.user has firstName, lastName, phone, email)
  const drivers = await prisma.driver.findMany({
    where: {
      companyId,
      deletedAt: null,
      user: { phone: { not: null } },
    },
    select: {
      id: true,
      driverNumber: true,
      telegramNumber: true,
      user: { select: { firstName: true, lastName: true, phone: true, email: true } },
    },
    take: 500,
  });

  // Sync customers
  for (const customer of customers) {
    try {
      await createNSContact({
        company: customer.name,
        phone_business: customer.phone || undefined,
        email: customer.email || undefined,
      }, companyId);
      synced++;
    } catch (e: any) {
      errors.push(`Customer ${customer.name}: ${e.message}`);
    }
  }

  // Sync drivers
  for (const driver of drivers) {
    try {
      const phone = driver.user?.phone || driver.telegramNumber;
      if (!phone) continue;

      await createNSContact({
        first_name: driver.user?.firstName,
        last_name: driver.user?.lastName || undefined,
        phone_mobile: phone || undefined,
        email: driver.user?.email || undefined,
        company: 'Driver',
      }, companyId);
      synced++;
    } catch (e: any) {
      errors.push(`Driver ${driver.driverNumber}: ${e.message}`);
    }
  }

  console.log(`[NetSapiens] Contact sync: ${synced} synced, ${errors.length} errors`);
  return { synced, errors };
}
