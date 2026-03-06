import { prisma } from '@/lib/prisma';
import { normalizePhone } from './messaging-utils';

export interface DriverMatchResult {
  driverId: string;
  driverName: string;
  confidence: number;
  method: 'EMAIL' | 'PHONE' | 'MATTERMOST_USERNAME' | 'NAME';
  truckNumber?: string;
}

interface ContactData {
  mattermostUserId: string;
  email?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface CachedDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  truckNumber?: string;
}

/**
 * Smart driver matching service for Mattermost users.
 * Matches users to drivers by email, phone, username, or name.
 */
export class MattermostDriverMatcher {
  private companyId: string;
  private driverCache: CachedDriver[] | null = null;
  private cacheTime = 0;
  private static CACHE_TTL = 30_000; // 30 seconds

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Find the best matching driver for a Mattermost user.
   * Returns null if no confident match found.
   */
  async findMatch(
    contact: ContactData,
  ): Promise<DriverMatchResult | null> {
    const drivers = await this.getDrivers();
    if (drivers.length === 0) return null;

    // 1. Email match (confidence: 0.95) — most reliable
    const emailMatch = this.matchByEmail(contact, drivers);
    if (emailMatch) return emailMatch;

    // 2. Phone number match (confidence: 0.90)
    const phoneMatch = this.matchByPhone(contact, drivers);
    if (phoneMatch) return phoneMatch;

    // 3. Name match (confidence: 0.60)
    const nameMatch = this.matchByName(contact, drivers);
    if (nameMatch) return nameMatch;

    return null;
  }

  private matchByEmail(
    contact: ContactData,
    drivers: CachedDriver[],
  ): DriverMatchResult | null {
    if (!contact.email) return null;
    const email = contact.email.toLowerCase().trim();

    const matches = drivers.filter(
      (d) => d.email && d.email.toLowerCase().trim() === email,
    );

    if (matches.length !== 1) return null;

    const d = matches[0];
    return {
      driverId: d.id,
      driverName: `${d.firstName} ${d.lastName}`.trim(),
      confidence: 0.95,
      method: 'EMAIL',
      truckNumber: d.truckNumber,
    };
  }

  private matchByPhone(
    contact: ContactData,
    drivers: CachedDriver[],
  ): DriverMatchResult | null {
    const contactPhone = normalizePhone(contact.phoneNumber);
    if (!contactPhone || contactPhone.length < 7) return null;

    const matches = drivers.filter((d) => {
      const driverPhone = normalizePhone(d.phone);
      return driverPhone && driverPhone === contactPhone;
    });

    if (matches.length !== 1) {
      if (matches.length > 1) {
        console.log(
          `[MattermostDriverMatcher] Ambiguous phone match: ${contactPhone} matches ${matches.length} drivers`,
        );
      }
      return null;
    }

    const d = matches[0];
    return {
      driverId: d.id,
      driverName: `${d.firstName} ${d.lastName}`.trim(),
      confidence: 0.9,
      method: 'PHONE',
      truckNumber: d.truckNumber,
    };
  }

  private matchByName(
    contact: ContactData,
    drivers: CachedDriver[],
  ): DriverMatchResult | null {
    const firstName = contact.firstName?.trim().toLowerCase();
    const lastName = contact.lastName?.trim().toLowerCase();
    if (!firstName || !lastName) return null;

    const matches = drivers.filter(
      (d) =>
        d.firstName.toLowerCase() === firstName &&
        d.lastName.toLowerCase() === lastName,
    );

    if (matches.length !== 1) return null;

    const d = matches[0];
    return {
      driverId: d.id,
      driverName: `${d.firstName} ${d.lastName}`.trim(),
      confidence: 0.6,
      method: 'NAME',
      truckNumber: d.truckNumber,
    };
  }

  private async getDrivers(): Promise<CachedDriver[]> {
    const now = Date.now();
    if (
      this.driverCache &&
      now - this.cacheTime < MattermostDriverMatcher.CACHE_TTL
    ) {
      return this.driverCache;
    }

    const drivers = await prisma.driver.findMany({
      where: { companyId: this.companyId, isActive: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        currentTruck: { select: { truckNumber: true } },
      },
    });

    this.driverCache = drivers.map((d) => ({
      id: d.id,
      firstName: d.user?.firstName || '',
      lastName: d.user?.lastName || '',
      phone: d.user?.phone || '',
      email: d.user?.email || '',
      truckNumber: d.currentTruck?.truckNumber || undefined,
    }));
    this.cacheTime = now;

    return this.driverCache;
  }
}
