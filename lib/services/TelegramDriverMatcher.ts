import { prisma } from '@/lib/prisma';
import { normalizePhone } from './telegram-utils';

export interface DriverMatchResult {
    driverId: string;
    driverName: string;
    confidence: number;
    method: 'PHONE' | 'TELEGRAM_NUMBER' | 'NAME';
    truckNumber?: string;
}

interface ContactData {
    telegramId: string;
    phoneNumber?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
}

interface CachedDriver {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    telegramNumber: string;
    truckNumber?: string;
}

/**
 * Smart driver matching service for Telegram contacts.
 * Matches contacts to drivers by phone, telegramNumber, or name.
 */
export class TelegramDriverMatcher {
    private companyId: string;
    private mcNumberId: string | null;
    private driverCache: CachedDriver[] | null = null;
    private cacheTime = 0;
    private static CACHE_TTL = 30_000; // 30 seconds

    constructor(companyId: string, mcNumberId: string | null = null) {
        this.companyId = companyId;
        this.mcNumberId = mcNumberId;
    }

    /**
     * Find the best matching driver for a Telegram contact.
     * Returns null if no confident match found.
     */
    async findMatch(contact: ContactData): Promise<DriverMatchResult | null> {
        const drivers = await this.getDrivers();
        if (drivers.length === 0) return null;

        // 1. Phone number match (confidence: 0.95)
        const phoneMatch = this.matchByPhone(contact, drivers);
        if (phoneMatch) return phoneMatch;

        // 2. Telegram number match (confidence: 0.90)
        const telegramMatch = this.matchByTelegramNumber(contact, drivers);
        if (telegramMatch) return telegramMatch;

        // 3. Name match (confidence: 0.60)
        const nameMatch = this.matchByName(contact, drivers);
        if (nameMatch) return nameMatch;

        return null;
    }

    private matchByPhone(contact: ContactData, drivers: CachedDriver[]): DriverMatchResult | null {
        const contactPhone = normalizePhone(contact.phoneNumber);
        if (!contactPhone || contactPhone.length < 7) return null;

        const matches = drivers.filter(d => {
            const driverPhone = normalizePhone(d.phone);
            const driverTelegram = normalizePhone(d.telegramNumber);
            return (driverPhone && driverPhone === contactPhone) ||
                   (driverTelegram && driverTelegram === contactPhone);
        });

        // Ambiguous — multiple drivers share this phone
        if (matches.length !== 1) {
            if (matches.length > 1) {
                console.log(`[TelegramDriverMatcher] Ambiguous phone match: ${contactPhone} matches ${matches.length} drivers`);
            }
            return null;
        }

        const d = matches[0];
        return {
            driverId: d.id,
            driverName: `${d.firstName} ${d.lastName}`.trim(),
            confidence: 0.95,
            method: 'PHONE',
            truckNumber: d.truckNumber,
        };
    }

    private matchByTelegramNumber(contact: ContactData, drivers: CachedDriver[]): DriverMatchResult | null {
        // Match the Telegram user ID against driver.telegramNumber field
        const telegramId = contact.telegramId;
        if (!telegramId) return null;

        const matches = drivers.filter(d => {
            if (!d.telegramNumber) return false;
            // Could be stored as the numeric ID directly
            return d.telegramNumber === telegramId ||
                   normalizePhone(d.telegramNumber) === normalizePhone(contact.phoneNumber);
        });

        if (matches.length !== 1) return null;

        const d = matches[0];
        return {
            driverId: d.id,
            driverName: `${d.firstName} ${d.lastName}`.trim(),
            confidence: 0.90,
            method: 'TELEGRAM_NUMBER',
            truckNumber: d.truckNumber,
        };
    }

    private matchByName(contact: ContactData, drivers: CachedDriver[]): DriverMatchResult | null {
        const firstName = contact.firstName?.trim().toLowerCase();
        const lastName = contact.lastName?.trim().toLowerCase();
        if (!firstName || !lastName) return null;

        const matches = drivers.filter(d =>
            d.firstName.toLowerCase() === firstName &&
            d.lastName.toLowerCase() === lastName
        );

        // Ambiguous — multiple drivers with the same name
        if (matches.length !== 1) return null;

        const d = matches[0];
        return {
            driverId: d.id,
            driverName: `${d.firstName} ${d.lastName}`.trim(),
            confidence: 0.60,
            method: 'NAME',
            truckNumber: d.truckNumber,
        };
    }

    private async getDrivers(): Promise<CachedDriver[]> {
        const now = Date.now();
        if (this.driverCache && now - this.cacheTime < TelegramDriverMatcher.CACHE_TTL) {
            return this.driverCache;
        }

        const drivers = await prisma.driver.findMany({
            where: { companyId: this.companyId, isActive: true },
            include: {
                user: { select: { firstName: true, lastName: true, phone: true } },
                currentTruck: { select: { truckNumber: true } },
            },
        });

        this.driverCache = drivers.map(d => ({
            id: d.id,
            firstName: d.user?.firstName || '',
            lastName: d.user?.lastName || '',
            phone: d.user?.phone || '',
            telegramNumber: d.telegramNumber || '',
            truckNumber: d.currentTruck?.truckNumber || undefined,
        }));
        this.cacheTime = now;

        return this.driverCache;
    }
}
