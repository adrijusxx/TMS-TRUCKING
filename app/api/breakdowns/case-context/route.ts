import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import {
    getSamsaraVehicleLocations,
    getSamsaraVehicleDiagnostics,
    getSamsaraVehicleStats,
    getSamsaraVehicles
} from '@/lib/integrations/samsara';

function normalize(value?: string | null): string | undefined {
    if (!value) return undefined;
    return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { truckId } = await req.json();

        if (!truckId) {
            return NextResponse.json({ error: 'Truck ID required' }, { status: 400 });
        }

        // 1. Fetch Truck from DB
        const truck = await prisma.truck.findUnique({
            where: { id: truckId },
            select: {
                id: true,
                truckNumber: true,
                samsaraId: true,
                licensePlate: true,
                vin: true
            },
        });

        if (!truck) {
            return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
        }

        // 2. Identify Samsara Vehicle
        let samsaraId = truck.samsaraId;
        let locationData = null;
        let diagnosticsData = null;
        let statsData = null;

        // A. Try using existing ID
        if (samsaraId) {
            // Check if this ID is valid by fetching location
            const locations = await getSamsaraVehicleLocations([samsaraId], session.user.companyId);
            if (locations && locations.length > 0) {
                locationData = locations[0];
            } else {
                console.log(`[CaseContext] Samsara ID ${samsaraId} returned no location. Retrying with fuzzy match.`);
                samsaraId = null; // Force fuzzy match
            }
        }

        // B. Fuzzy Match (if no ID or ID failed)
        if (!samsaraId) {
            console.log(`[CaseContext] Attempting fuzzy match for truck ${truck.truckNumber}`);
            const allVehicles = await getSamsaraVehicles(session.user.companyId);
            if (allVehicles) {
                const normalizedTruckNum = normalize(truck.truckNumber);
                const normalizedPlate = normalize(truck.licensePlate);
                const normalizedVin = normalize(truck.vin);

                const match = allVehicles.find(v => {
                    const vName = normalize(v.name);
                    const vPlate = normalize(v.licensePlate);
                    const vVin = normalize(v.vin);

                    return (vName && normalizedTruckNum && vName === normalizedTruckNum) ||
                        (vPlate && normalizedPlate && vPlate === normalizedPlate) ||
                        (vVin && normalizedVin && vVin === normalizedVin);
                });

                if (match) {
                    console.log(`[CaseContext] Fuzzy matched truck ${truck.truckNumber} to Samsara ID ${match.id}`);
                    samsaraId = match.id;

                    // Self-Healing: Update DB
                    await prisma.truck.update({
                        where: { id: truck.id },
                        data: { samsaraId: match.id }
                    });

                    // Fetch location for this new ID
                    const locations = await getSamsaraVehicleLocations([samsaraId], session.user.companyId);
                    if (locations && locations.length > 0) locationData = locations[0];
                }
            }
        }

        if (!samsaraId) {
            return NextResponse.json({
                success: false,
                message: 'No Samsara ID linked to this truck (and automatic matching failed)',
                data: {
                    truck: { id: truck.id, number: truck.truckNumber },
                }
            });
        }

        // 3. Fetch Diagnostics & Stats
        // Data is often returned for ALL vehicles, we need to find ours
        // But getSamsaraVehicleStats might support filtering? The header says getSamsaraVehicleStats(companyId).
        // It fetches ALL. We filter in memory.
        const [diagnosticsList, statsList] = await Promise.all([
            getSamsaraVehicleDiagnostics(undefined, session.user.companyId),
            getSamsaraVehicleStats(undefined, session.user.companyId)
        ]);

        // Filter for our vehicle
        console.log(`[CaseContext] Filtering for Samsara ID: ${samsaraId}`);
        const diagnostics = diagnosticsList?.find((d: any) => String(d.vehicleId) === String(samsaraId)) || null;

        // Stats array might have 'id' or 'vehicleId'
        const stats = statsList?.find((s: any) => {
            const vId = s.id || s.vehicleId;
            return String(vId) === String(samsaraId);
        }) || null;

        console.log(`[CaseContext] Diagnostics found: ${!!diagnostics}, Stats found: ${!!stats}`);
        if (stats) console.log(`[CaseContext] Stats Data:`, JSON.stringify(stats));

        // 4. Parse Stats (Fuel, Odo, etc)
        // Helper to extract value from object or number
        const getValue = (val: any) => (typeof val === 'object' && val?.value !== undefined) ? val.value : val;

        // Fuel
        let fuelLevel = undefined;
        const fuelData = (stats as any)?.fuelPercents ?? stats?.fuelPercent;
        if (fuelData !== undefined && fuelData !== null) {
            if (Array.isArray(fuelData) && fuelData.length > 0) {
                const firstItem = fuelData[0] as any;
                fuelLevel = (typeof firstItem === 'object' && firstItem !== null) ? firstItem.value : firstItem;
            } else if (typeof fuelData === 'object' && fuelData !== null && fuelData.value !== undefined) {
                fuelLevel = fuelData.value;
            } else if (typeof fuelData === 'number') {
                fuelLevel = fuelData;
            }
        }
        if (fuelLevel === undefined || fuelLevel === null) {
            fuelLevel = (stats as any)?.fuelLevel;
        }

        // Odometer
        let odometerMiles = undefined;
        const odoRaw = (stats as any)?.obdOdometerMeters ?? (stats as any)?.gpsOdometerMeters;
        let odometerMeters: number | undefined;
        if (Array.isArray(odoRaw) && odoRaw.length > 0) {
            odometerMeters = (typeof odoRaw[0] === 'object' && odoRaw[0] !== null) ? odoRaw[0].value : odoRaw[0];
        } else if (typeof odoRaw === 'object' && odoRaw !== null && odoRaw.value !== undefined) {
            odometerMeters = odoRaw.value;
        } else if (typeof odoRaw === 'number') {
            odometerMeters = odoRaw;
        }

        if (odometerMeters) odometerMiles = odometerMeters * 0.000621371;
        if (!odometerMiles) odometerMiles = (stats as any)?.obdOdometerMiles ?? stats?.odometerMiles;

        // Engine Hours
        let engineHours = undefined;
        const engRaw = (stats as any)?.obdEngineSeconds ?? (stats as any)?.syntheticEngineSeconds;
        let engineSeconds: number | undefined;
        if (Array.isArray(engRaw) && engRaw.length > 0) {
            engineSeconds = (typeof engRaw[0] === 'object' && engRaw[0] !== null) ? engRaw[0].value : engRaw[0];
        } else if (typeof engRaw === 'object' && engRaw !== null && engRaw.value !== undefined) {
            engineSeconds = engRaw.value;
        } else if (typeof engRaw === 'number') {
            engineSeconds = engRaw;
        }

        if (engineSeconds) engineHours = engineSeconds / 3600;
        if (!engineHours) engineHours = stats?.engineHours;

        // Speed
        const speed = locationData?.location?.speedMilesPerHour || getValue((stats as any)?.ecuSpeedMph);

        // Debug logging
        console.log(`[CaseContext] locationData:`, JSON.stringify(locationData));
        console.log(`[CaseContext] fuelLevel: ${fuelLevel}, odometer: ${odometerMiles}`);

        return NextResponse.json({
            success: true,
            data: {
                samsaraId,
                location: locationData?.location ? {
                    // Try multiple address sources (Samsara varies)
                    address: locationData.location.address
                        || (locationData.location as any).reverseGeo?.formattedLocation
                        || (locationData.location.latitude && locationData.location.longitude
                            ? `${locationData.location.latitude.toFixed(5)}, ${locationData.location.longitude.toFixed(5)}`
                            : null),
                    latitude: locationData.location.latitude,
                    longitude: locationData.location.longitude,
                    speed: speed,
                    heading: locationData.location.heading,
                    time: (locationData.location as any).vehicleTime
                } : null,
                diagnostics: {
                    faultCodes: diagnostics?.faults?.filter((f: any) => f.active) || [],
                    checkEngineLight: diagnostics?.checkEngineLightOn
                },
                stats: {
                    fuelLevel: typeof fuelLevel === 'number' ? Math.round(fuelLevel) : null,
                    odometer: odometerMiles ? Math.round(odometerMiles) : null,
                    engineHours: engineHours ? Math.round(engineHours) : null,
                }
            }
        });

    } catch (error: any) {
        console.error('Error fetching case context:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
