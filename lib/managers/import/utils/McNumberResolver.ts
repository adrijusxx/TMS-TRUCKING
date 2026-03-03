/**
 * McNumberResolver — Pre-fetches MC numbers and resolves row-level MC values.
 * Extracts MC lookup logic used by Truck, Trailer, Driver, and other importers.
 */

import type { PrismaClient } from '@prisma/client';

export interface McNumberLookup {
    mcIdMap: Map<string, string>;
    defaultMcId: string | undefined;
}

/**
 * Pre-fetch all MC numbers for a company and build a lookup map.
 * Returns both the ID-by-value map and the default MC ID.
 */
export async function preFetchMcNumbers(
    prisma: PrismaClient,
    companyId: string
): Promise<McNumberLookup> {
    const mcNumbers = await prisma.mcNumber.findMany({
        where: { companyId, deletedAt: null },
        select: { id: true, number: true, isDefault: true, companyName: true }
    });

    const mcIdMap = new Map<string, string>();
    const defaultMcId = mcNumbers.find(mc => mc.isDefault)?.id || mcNumbers[0]?.id;

    for (const mc of mcNumbers) {
        if (mc.number) mcIdMap.set(mc.number.trim(), mc.id);
        if (mc.companyName) mcIdMap.set(mc.companyName.trim().toLowerCase(), mc.id);
    }

    return { mcIdMap, defaultMcId };
}

/**
 * Resolve a row-level MC value to an MC number ID.
 * Falls back to currentMcNumber, then to the default MC.
 */
export function resolveMcFromRow(
    rowValue: string | null | undefined,
    currentMcNumber: string | null | undefined,
    lookup: McNumberLookup
): string | undefined {
    if (rowValue) {
        const id = lookup.mcIdMap.get(rowValue.trim());
        if (id) return id;
    }
    if (currentMcNumber) {
        const id = lookup.mcIdMap.get(currentMcNumber.trim());
        if (id) return id;
    }
    return lookup.defaultMcId;
}
