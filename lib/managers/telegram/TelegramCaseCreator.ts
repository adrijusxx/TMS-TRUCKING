import { prisma } from '@/lib/prisma';
import { BreakdownType, BreakdownPriority } from '@prisma/client';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara/fleet';

/**
 * Creates breakdown, safety, and maintenance cases from AI analysis.
 * Extracted from TelegramMessageProcessor for reuse by the review queue approval flow.
 */
export class TelegramCaseCreator {
    constructor(private companyId: string) {}

    async createBreakdownCase(
        driverId: string,
        truckId: string | undefined,
        samsaraId: string | undefined | null,
        analysis: any,
        originalMessage: string
    ) {
        const breakdownNumber = await this.generateCaseNumber('BD', 'breakdown', 'breakdownNumber');

        const priorityMap: Record<string, BreakdownPriority> = {
            LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL',
        };

        let location = analysis.location || 'Unknown';
        let latitude: number | undefined;
        let longitude: number | undefined;

        if (samsaraId) {
            try {
                const locations = await getSamsaraVehicleLocations([samsaraId]);
                const loc = locations?.[0]?.location;
                if (loc) {
                    location = (loc as any).formattedAddress || (loc as any).address || location;
                    latitude = (loc as any).latitude;
                    longitude = (loc as any).longitude;
                }
            } catch {
                console.warn('[TelegramCaseCreator] Samsara GPS lookup failed');
            }
        }

        return prisma.breakdown.create({
            data: {
                companyId: this.companyId,
                breakdownNumber,
                truckId: truckId || '',
                driverId,
                breakdownType: detectBreakdownType(analysis),
                priority: priorityMap[analysis.urgency] || 'MEDIUM',
                problem: analysis.problemDescription || 'Unknown',
                description: originalMessage,
                location,
                latitude,
                longitude,
                odometerReading: 0,
                status: 'REPORTED',
                reportedAt: new Date(),
            },
        });
    }

    async createSafetyIncident(
        driverId: string,
        truckId: string | undefined,
        analysis: any,
        originalMessage: string
    ) {
        const incidentNumber = await this.generateCaseNumber('SI', 'safetyIncident', 'incidentNumber');
        return prisma.safetyIncident.create({
            data: {
                companyId: this.companyId,
                incidentNumber,
                driverId,
                truckId: truckId || null,
                incidentType: 'OTHER',
                severity: (analysis.urgency === 'CRITICAL' || analysis.urgency === 'HIGH') ? 'MAJOR' : 'MINOR',
                date: new Date(),
                location: analysis.location || 'Unknown',
                description: analysis.problemDescription || originalMessage,
                status: 'REPORTED',
            },
        });
    }

    async createMaintenanceRequest(
        driverId: string,
        truckId: string | undefined,
        analysis: any,
        originalMessage: string
    ) {
        if (!truckId) throw new Error('Truck ID is required for maintenance requests');
        const recordNumber = await this.generateCaseNumber('MAINT', 'maintenanceRecord', 'maintenanceNumber');
        return prisma.maintenanceRecord.create({
            data: {
                companyId: this.companyId,
                maintenanceNumber: recordNumber,
                truckId,
                type: 'REPAIR',
                description: analysis.problemDescription || originalMessage,
                cost: 0,
                odometer: 0,
                date: new Date(),
                status: 'OPEN',
            },
        });
    }

    private async generateCaseNumber(prefix: string, model: string, field: string): Promise<string> {
        const year = new Date().getFullYear();
        const basePrefix = `${prefix}-${year}-`;

        // @ts-ignore - dynamic prisma access
        const lastRecord = await (prisma[model] as any).findFirst({
            where: { [field]: { startsWith: basePrefix } },
            orderBy: { [field]: 'desc' },
        });

        let nextNumber = 1;
        if (lastRecord) {
            const parts = lastRecord[field].split('-');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
        return `${basePrefix}${nextNumber.toString().padStart(4, '0')}`;
    }
}

export function detectBreakdownType(analysis: any): BreakdownType {
    if (analysis.breakdownType && analysis.breakdownType in BreakdownType) {
        return analysis.breakdownType as BreakdownType;
    }
    const desc = (analysis.problemDescription || '').toLowerCase();
    const keywords = (analysis.entities?.keywords || []).map((k: string) => k.toLowerCase());
    const all = [desc, ...keywords].join(' ');

    if (/engine|motor|overheat|knock|misfire|no.?start/.test(all)) return BreakdownType.ENGINE_FAILURE;
    if (/transmission|gear|shift|clutch/.test(all)) return BreakdownType.TRANSMISSION_FAILURE;
    if (/brake|stopping|abs/.test(all)) return BreakdownType.BRAKE_FAILURE;
    if (/tire|flat|blowout|puncture/.test(all)) return BreakdownType.TIRE_FLAT;
    if (/electric|battery|alternator|starter|wiring|light/.test(all)) return BreakdownType.ELECTRICAL_ISSUE;
    if (/cool|radiat|water.?pump|antifreeze|overheat/.test(all)) return BreakdownType.COOLING_SYSTEM;
    if (/fuel|diesel|pump|injector|tank/.test(all)) return BreakdownType.FUEL_SYSTEM;
    if (/suspension|shock|spring|axle|leaf/.test(all)) return BreakdownType.SUSPENSION;
    if (/accident|collision|crash|hit|damage/.test(all)) return BreakdownType.ACCIDENT_DAMAGE;
    if (/weather|ice|snow|flood|wind/.test(all)) return BreakdownType.WEATHER_RELATED;
    return BreakdownType.OTHER;
}
