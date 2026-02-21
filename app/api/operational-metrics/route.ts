import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { samsaraRequest } from '@/lib/integrations/samsara/client';

/**
 * POST /api/operational-metrics
 * Sync operational metrics from external sources:
 *   - Diesel price from EIA (U.S. Energy Information Administration)
 *   - Fleet average MPG from Samsara fuel efficiency reports
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action } = body; // 'sync_fuel_price' | 'sync_mpg' | 'sync_truck_mpg' | 'sync_all'

        const results: Record<string, any> = {};

        // --- Sync Diesel Price from EIA ---
        if (action === 'sync_fuel_price' || action === 'sync_all') {
            results.fuelPrice = await fetchDieselPrice();
        }

        // --- Sync Fleet Average MPG from Samsara ---
        if (action === 'sync_mpg' || action === 'sync_all') {
            results.mpg = await fetchFleetAverageMpg(session.user.companyId);
        }

        // --- Sync Per-Truck MPG from Samsara ---
        if (action === 'sync_truck_mpg' || action === 'sync_all') {
            results.truckMpg = await syncPerTruckMpg(session.user.companyId);
        }

        return NextResponse.json({ success: true, data: results });
    } catch (error: any) {
        console.error('[OperationalMetrics] Sync error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Sync failed' } },
            { status: 500 }
        );
    }
}

/**
 * Fetch current national average diesel price from EIA API v2.
 * Uses series ID: PET.EMD_EPD2D_PTE_NUS_DPG.W (Weekly U.S. No 2 Diesel Retail Prices)
 * EIA API is free and open, requires an API key (or DEMO_KEY for limited use).
 */
async function fetchDieselPrice(): Promise<{ price: number | null; source: string; date: string | null; error?: string }> {
    try {
        const apiKey = process.env.EIA_API_KEY || 'DEMO_KEY';

        const url = new URL('https://api.eia.gov/v2/petroleum/pri/grd/data/');
        url.searchParams.set('api_key', apiKey);
        url.searchParams.set('frequency', 'weekly');
        url.searchParams.set('data[0]', 'value');
        url.searchParams.set('facets[product][]', 'EPD2D');
        url.searchParams.set('facets[duession][]', 'NUS');
        url.searchParams.set('sort[0][column]', 'period');
        url.searchParams.set('sort[0][direction]', 'desc');
        url.searchParams.set('length', '1');

        const response = await fetch(url.toString(), {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            // Fallback: try the series API (v2 alternative)
            return await fetchDieselPriceFallback(apiKey);
        }

        const data = await response.json();
        const record = data?.response?.data?.[0];

        if (record?.value) {
            return {
                price: parseFloat(record.value),
                source: 'EIA (U.S. Energy Information Administration)',
                date: record.period || null,
            };
        }

        return await fetchDieselPriceFallback(apiKey);
    } catch (error: any) {
        console.error('[OperationalMetrics] EIA API error:', error.message);
        return {
            price: null,
            source: 'EIA',
            date: null,
            error: 'Could not fetch diesel price. You can enter it manually.',
        };
    }
}

/**
 * Fallback: try the EIA series endpoint
 */
async function fetchDieselPriceFallback(apiKey: string): Promise<{ price: number | null; source: string; date: string | null; error?: string }> {
    try {
        const seriesUrl = `https://api.eia.gov/v2/seriesid/PET.EMD_EPD2D_PTE_NUS_DPG.W?api_key=${apiKey}`;
        const res = await fetch(seriesUrl);

        if (res.ok) {
            const seriesData = await res.json();
            const latestValue = seriesData?.response?.data?.[0]?.value;
            const latestDate = seriesData?.response?.data?.[0]?.period;

            if (latestValue) {
                return {
                    price: parseFloat(latestValue),
                    source: 'EIA Series API',
                    date: latestDate || null,
                };
            }
        }

        return {
            price: null,
            source: 'EIA',
            date: null,
            error: 'EIA API returned no data. Try setting an API key in EIA_API_KEY env variable, or enter manually.',
        };
    } catch {
        return {
            price: null,
            source: 'EIA',
            date: null,
            error: 'EIA API is unreachable. Enter fuel price manually.',
        };
    }
}

/**
 * Fetch fleet average MPG from Samsara fuel efficiency reports.
 * Uses: GET /fleet/reports/vehicles/fuel-energy
 */
async function fetchFleetAverageMpg(companyId: string): Promise<{
    averageMpg: number | null;
    vehicleCount: number;
    source: string;
    error?: string;
}> {
    try {
        // Last 30 days
        const endTime = new Date().toISOString();
        const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const params = new URLSearchParams();
        params.set('startTime', startTime);
        params.set('endTime', endTime);

        const result = await samsaraRequest<{
            data?: Array<{
                vehicle?: { id: string; name?: string };
                fuelUsageMl?: number;
                distanceMeters?: number;
                efficiencyMpge?: number;
            }>;
        }>(`/fleet/reports/vehicles/fuel-energy?${params.toString()}`, {}, companyId);

        if (!result?.data || result.data.length === 0) {
            return {
                averageMpg: null,
                vehicleCount: 0,
                source: 'Samsara',
                error: 'No fuel efficiency data found. Ensure Samsara is connected and vehicles have fuel data.',
            };
        }

        // Calculate fleet average MPG from individual vehicle efficiencies
        const validEntries = result.data.filter((entry) => {
            // Prefer efficiencyMpge directly from Samsara
            if (entry.efficiencyMpge && entry.efficiencyMpge > 0) return true;
            // Fallback: calculate from distance and fuel consumed
            if (entry.distanceMeters && entry.fuelUsageMl) return true;
            return false;
        });

        if (validEntries.length === 0) {
            return {
                averageMpg: null,
                vehicleCount: 0,
                source: 'Samsara',
                error: 'No vehicles with fuel consumption data in the last 30 days.',
            };
        }

        let totalMpg = 0;
        for (const entry of validEntries) {
            if (entry.efficiencyMpge && entry.efficiencyMpge > 0) {
                totalMpg += entry.efficiencyMpge;
            } else if (entry.distanceMeters && entry.fuelUsageMl) {
                // Convert: meters -> miles, ml -> gallons
                const miles = entry.distanceMeters * 0.000621371;
                const gallons = entry.fuelUsageMl * 0.000264172;
                if (gallons > 0) {
                    totalMpg += miles / gallons;
                }
            }
        }

        const averageMpg = Math.round((totalMpg / validEntries.length) * 10) / 10;

        return {
            averageMpg,
            vehicleCount: validEntries.length,
            source: 'Samsara (30-day average)',
        };
    } catch (error: any) {
        console.error('[OperationalMetrics] Samsara MPG error:', error.message);
        return {
            averageMpg: null,
            vehicleCount: 0,
            source: 'Samsara',
            error: 'Failed to fetch from Samsara. Check API connection.',
        };
    }
}

/**
 * Sync per-truck MPG from Samsara. Maps each vehicle's efficiency to the
 * corresponding Truck record via samsaraId.
 */
async function syncPerTruckMpg(companyId: string): Promise<{
    updated: number;
    total: number;
    source: string;
    error?: string;
}> {
    try {
        const endTime = new Date().toISOString();
        const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const params = new URLSearchParams();
        params.set('startTime', startTime);
        params.set('endTime', endTime);

        const result = await samsaraRequest<{
            data?: Array<{
                vehicle?: { id: string; name?: string };
                fuelUsageMl?: number;
                distanceMeters?: number;
                efficiencyMpge?: number;
            }>;
        }>(`/fleet/reports/vehicles/fuel-energy?${params.toString()}`, {}, companyId);

        if (!result?.data || result.data.length === 0) {
            return { updated: 0, total: 0, source: 'Samsara', error: 'No fuel data from Samsara.' };
        }

        let updated = 0;
        const now = new Date();

        for (const entry of result.data) {
            const samsaraId = entry.vehicle?.id;
            if (!samsaraId) continue;

            let mpg: number | null = null;
            if (entry.efficiencyMpge && entry.efficiencyMpge > 0) {
                mpg = Math.round(entry.efficiencyMpge * 10) / 10;
            } else if (entry.distanceMeters && entry.fuelUsageMl && entry.fuelUsageMl > 0) {
                const miles = entry.distanceMeters * 0.000621371;
                const gallons = entry.fuelUsageMl * 0.000264172;
                mpg = gallons > 0 ? Math.round((miles / gallons) * 10) / 10 : null;
            }

            if (mpg && mpg > 0) {
                const truck = await prisma.truck.findFirst({
                    where: { samsaraId, companyId, deletedAt: null },
                    select: { id: true },
                });
                if (truck) {
                    await prisma.truck.update({
                        where: { id: truck.id },
                        data: { averageMpg: mpg, mpgLastUpdated: now },
                    });
                    updated++;
                }
            }
        }

        return { updated, total: result.data.length, source: 'Samsara (30-day per-truck)' };
    } catch (error: any) {
        console.error('[OperationalMetrics] Per-truck MPG sync error:', error.message);
        return { updated: 0, total: 0, source: 'Samsara', error: 'Failed to sync per-truck MPG.' };
    }
}
