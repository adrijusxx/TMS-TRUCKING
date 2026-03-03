/**
 * DriverLookupHelper — Shared driver lookup map builder.
 * Used by Truck, Trailer, Settlement, and other importers.
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Build a driver lookup map keyed by driverNumber, fullName, and lastName.
 * All keys are lowercased and trimmed for consistent matching.
 */
export async function buildDriverLookupMap(
    prisma: PrismaClient,
    companyId: string
): Promise<Map<string, string>> {
    const drivers = await prisma.driver.findMany({
        where: { companyId, deletedAt: null },
        select: {
            id: true,
            driverNumber: true,
            user: { select: { firstName: true, lastName: true } }
        }
    });

    const map = new Map<string, string>();
    for (const d of drivers) {
        map.set(d.driverNumber.toLowerCase().trim(), d.id);
        if (d.user) {
            const fullName = `${d.user.firstName} ${d.user.lastName}`.toLowerCase().trim();
            map.set(fullName, d.id);
            map.set(d.user.lastName.toLowerCase().trim(), d.id);
        }
    }
    return map;
}
