import { getSamsaraVehicles, getSamsaraAssets, getSamsaraVehicleStats } from '@/lib/integrations/samsara';

export class SamsaraApiService {
    /**
     * Fetch all vehicles and assets from Samsara
     */
    async fetchData(companyId: string, errors: string[]) {
        const [vehicles, assets] = await Promise.all([
            getSamsaraVehicles(companyId).catch(err => {
                errors.push(`Failed to fetch vehicles: ${err.message}`);
                return [];
            }),
            getSamsaraAssets(companyId).catch(err => {
                errors.push(`Failed to fetch assets: ${err.message}`);
                return [];
            }),
        ]);

        return { vehicles, assets };
    }

    /**
     * Fetch and map vehicle stats (odometer/engine hours)
     */
    async fetchStatsMap(companyId: string) {
        const stats = await getSamsaraVehicleStats(undefined, companyId).catch(() => []);
        const statsMap = new Map<string, { odometerMiles?: number; engineHours?: number }>();

        stats?.forEach((s: any) => {
            const vehicleId = s.id || s.vehicleId;
            if (vehicleId) {
                const odometerMiles = this.parseOdometer(s);
                const engineHours = this.parseEngineHours(s);

                statsMap.set(vehicleId, { odometerMiles, engineHours });
            }
        });

        return statsMap;
    }

    private parseOdometer(s: any): number | undefined {
        let meters: number | undefined;
        const odoRaw = s.obdOdometerMeters;
        if (Array.isArray(odoRaw) && odoRaw.length > 0) meters = odoRaw[0].value ?? odoRaw[0];
        else if (typeof odoRaw === 'object' && odoRaw !== null) meters = odoRaw.value;
        else if (typeof odoRaw === 'number') meters = odoRaw;

        return meters ? Number(meters) * 0.000621371 : undefined;
    }

    private parseEngineHours(s: any): number | undefined {
        let seconds: number | undefined;
        const engRaw = s.obdEngineSeconds ?? s.syntheticEngineSeconds;
        if (Array.isArray(engRaw) && engRaw.length > 0) seconds = engRaw[0].value ?? engRaw[0];
        else if (typeof engRaw === 'object' && engRaw !== null) seconds = engRaw.value;
        else if (typeof engRaw === 'number') seconds = engRaw;

        return seconds ? Number(seconds) / 3600 : undefined;
    }
}
