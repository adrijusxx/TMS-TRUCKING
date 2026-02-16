import { prisma } from '@/lib/prisma';
import { calculateDistanceMatrix } from '@/lib/maps/google-maps';

export interface StateMileage {
    state: string;
    miles: number;
}

/**
 * IFTAMileageService
 * 
 * Handles distance tracking and state-by-state mileage breakdowns.
 */
export class IFTAMileageService {
    static async calculateMileageByState(loadId: string): Promise<StateMileage[]> {
        const load = await prisma.load.findUnique({
            where: { id: loadId },
            include: { stops: { orderBy: { sequence: 'asc' } }, route: true },
        });

        if (!load) throw new Error('Load not found');
        const stateMileages: Record<string, number> = {};

        // Fallback simple algorithm
        const locations: Array<{ city: string; state: string }> = [];
        if (load.stops?.length > 0) {
            load.stops.forEach(s => locations.push({ city: s.city, state: s.state }));
        } else {
            if (load.pickupCity && load.pickupState) locations.push({ city: load.pickupCity, state: load.pickupState });
            if (load.deliveryCity && load.deliveryState) locations.push({ city: load.deliveryCity, state: load.deliveryState });
        }

        if (locations.length < 2) return [];

        for (let i = 0; i < locations.length - 1; i++) {
            const from = locations[i];
            const to = locations[i + 1];
            const distance = await this.getDistance(from, to);

            if (from.state === to.state) {
                stateMileages[from.state] = (stateMileages[from.state] || 0) + distance;
            } else {
                const half = distance / 2;
                stateMileages[from.state] = (stateMileages[from.state] || 0) + half;
                stateMileages[to.state] = (stateMileages[to.state] || 0) + half;
            }
        }

        return Object.entries(stateMileages).map(([state, miles]) => ({
            state, miles: Math.round(miles * 10) / 10
        }));
    }

    private static async getDistance(from: any, to: any): Promise<number> {
        try {
            const results = await calculateDistanceMatrix({ origins: [from], destinations: [to], mode: 'driving', units: 'imperial' });
            // distance in DistanceMatrixResponse is a number (meters)
            if (results?.[0]?.[0]?.distance) {
                return results[0][0].distance / 1609.34;
            }
        } catch (e) { console.error('Dist calc error', e); }
        return from.state === to.state ? 200 : 500;
    }
}
