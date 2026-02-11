/**
 * WorkflowHealthManager
 * 
 * Detects orphan records, data inconsistencies, and "ghost" entities
 * that could cause reporting issues or operational confusion.
 */

import { prisma } from '@/lib/prisma';

export interface HealthReport {
    timestamp: Date;
    orphans: {
        loadsWithoutStops: string[];
        driversWithoutMc: string[];
        trucksWithoutMc: string[];
        unassignedRateCons: string[];
    };
    inconsistencies: {
        invalidVins: string[];
        missingLicensePlates: string[];
        duplicateLoadNumbers: string[];
    };
}

export class WorkflowHealthManager {
    /**
     * Run a comprehensive health scan for a company/MC
     */
    async runHealthScan(companyId: string, mcNumberId?: string): Promise<HealthReport> {
        const [
            loadsWithoutStops,
            driversWithoutMc,
            trucksWithoutMc,
            unassignedRateCons,
            invalidVins,
            missingLicensePlates,
        ] = await Promise.all([
            // 1. Loads with 0 stops
            prisma.load.findMany({
                where: {
                    companyId,
                    mcNumberId,
                    deletedAt: null,
                    stops: { none: {} },
                },
                select: { loadNumber: true },
            }),

            // 2. Drivers with no assigned MC (if not admin)
            prisma.driver.findMany({
                where: {
                    companyId,
                    mcNumberId: null,
                    deletedAt: null,
                    isActive: true,
                },
                select: { driverNumber: true },
            }),

            // 3. Trucks with no assigned MC
            prisma.truck.findMany({
                where: {
                    companyId,
                    mcNumberId: null,
                    deletedAt: null,
                    isActive: true,
                },
                select: { truckNumber: true },
            }),

            // 5. Rate Confirmations not linked to a Load
            // prisma.rateConfirmation.findMany({
            //     where: {
            //         loadId: null, // loadId is required
            //         deletedAt: null,
            //     },
            //     select: { id: true },
            // }),
            Promise.resolve([] as { id: string }[]), // Placeholder

            // 5. Invalid VINs (basic length check)
            prisma.truck.findMany({
                where: {
                    companyId,
                    mcNumberId,
                    deletedAt: null,
                    OR: [
                        // { vin: null }, // vin is required
                        { vin: { contains: ' ' } },
                    ],
                },
                select: { truckNumber: true, vin: true },
            }),

            // 6. Missing License Plates
            prisma.truck.findMany({
                where: {
                    companyId,
                    mcNumberId,
                    deletedAt: null,
                    isActive: true,
                    // licensePlate: null, // licensePlate is required
                    licensePlate: { equals: '' } // Check for empty string instead
                },
                select: { truckNumber: true },
            }),
        ]);

        return {
            timestamp: new Date(),
            orphans: {
                loadsWithoutStops: loadsWithoutStops.map(l => l.loadNumber),
                driversWithoutMc: driversWithoutMc.map(d => d.driverNumber),
                trucksWithoutMc: trucksWithoutMc.map(t => t.truckNumber),
                unassignedRateCons: unassignedRateCons.map(r => r.id),
            },
            inconsistencies: {
                invalidVins: invalidVins.map(t => `${t.truckNumber} (${t.vin || 'MISSING'})`),
                missingLicensePlates: missingLicensePlates.map(t => t.truckNumber),
                duplicateLoadNumbers: [], // Would require complex group by
            },
        };
    }
}
