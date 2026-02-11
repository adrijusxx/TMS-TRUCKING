import { prisma } from '@/lib/prisma';
import { MatchResult, SamsaraDevice } from './types';

export class SamsaraMatchingService {
    /**
     * Match device to existing TMS record by name/number then VIN
     */
    async matchToExistingRecord(
        companyId: string,
        device: SamsaraDevice,
        deviceType: 'TRUCK' | 'TRAILER'
    ): Promise<MatchResult | null> {
        const normalizedName = this.normalize(device.name);
        const normalizedVin = this.normalize(device.vin);
        const normalizedPlate = this.normalize(device.licensePlate);

        if (deviceType === 'TRUCK') {
            const trucks = await prisma.truck.findMany({
                where: { companyId, deletedAt: null, samsaraId: null },
                select: { id: true, truckNumber: true, vin: true, licensePlate: true },
            });

            for (const truck of trucks) {
                if (this.normalize(truck.truckNumber) === normalizedName) {
                    return { type: 'TRUCK', recordId: truck.id, matchSource: 'name' };
                }
            }

            if (normalizedVin) {
                for (const truck of trucks) {
                    if (this.normalize(truck.vin) === normalizedVin) {
                        return { type: 'TRUCK', recordId: truck.id, matchSource: 'vin' };
                    }
                }
            }

            if (normalizedPlate) {
                for (const truck of trucks) {
                    if (this.normalize(truck.licensePlate) === normalizedPlate) {
                        return { type: 'TRUCK', recordId: truck.id, matchSource: 'licensePlate' };
                    }
                }
            }
        } else {
            const trailers = await prisma.trailer.findMany({
                where: { companyId, deletedAt: null, samsaraId: null },
                select: { id: true, trailerNumber: true, vin: true, licensePlate: true },
            });

            for (const trailer of trailers) {
                if (this.normalize(trailer.trailerNumber) === normalizedName) {
                    return { type: 'TRAILER', recordId: trailer.id, matchSource: 'name' };
                }
            }

            if (normalizedVin) {
                for (const trailer of trailers) {
                    if (this.normalize(trailer.vin) === normalizedVin) {
                        return { type: 'TRAILER', recordId: trailer.id, matchSource: 'vin' };
                    }
                }
            }

            if (normalizedPlate) {
                for (const trailer of trailers) {
                    if (this.normalize(trailer.licensePlate) === normalizedPlate) {
                        return { type: 'TRAILER', recordId: trailer.id, matchSource: 'licensePlate' };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Normalize string for comparison
     */
    normalize(value?: string | null): string | undefined {
        if (!value) return undefined;
        return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
}
