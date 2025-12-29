import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const optimizeRouteSchema = z.object({
  loadIds: z.array(z.string().cuid()).min(2, 'At least 2 loads required for optimization'),
  optimizationType: z.enum(['DISTANCE', 'TIME', 'COST']).default('DISTANCE'),
  startLocation: z.object({
    city: z.string(),
    state: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

// Simple TSP (Traveling Salesman Problem) solver using nearest neighbor heuristic
function optimizeRoute(
  loads: Array<{
    id: string;
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
    pickupDate: Date;
    deliveryDate: Date;
    revenue: number;
    distance?: number;
  }>,
  optimizationType: 'DISTANCE' | 'TIME' | 'COST',
  startLocation?: { city: string; state: string; latitude?: number; longitude?: number }
): string[] {
  if (loads.length <= 1) return loads.map((l) => l.id);

  // Calculate distances between all points
  const distances: Record<string, Record<string, number>> = {};
  const allPoints: Array<{ id: string; city: string; state: string; type: 'pickup' | 'delivery'; loadId: string }> = [];

  // Add start location if provided
  if (startLocation) {
    allPoints.push({
      id: 'start',
      city: startLocation.city,
      state: startLocation.state,
      type: 'pickup',
      loadId: 'start',
    });
  }

  // Add all pickup and delivery points
  loads.forEach((load) => {
    allPoints.push({
      id: `pickup-${load.id}`,
      city: load.pickupCity,
      state: load.pickupState,
      type: 'pickup',
      loadId: load.id,
    });
    allPoints.push({
      id: `delivery-${load.id}`,
      city: load.deliveryCity,
      state: load.deliveryState,
      type: 'delivery',
      loadId: load.id,
    });
  });

  // Calculate distances (simplified - would use actual routing API)
  allPoints.forEach((point1) => {
    distances[point1.id] = {};
    allPoints.forEach((point2) => {
      if (point1.id === point2.id) {
        distances[point1.id][point2.id] = 0;
      } else {
        // Simplified distance calculation
        const distance = calculateDistance(point1, point2);
        distances[point1.id][point2.id] = distance;
      }
    });
  });

  // Build optimized sequence
  const optimizedSequence: string[] = [];
  const visited = new Set<string>();
  let currentPoint = startLocation ? 'start' : allPoints.find((p) => p.type === 'pickup')?.id;

  if (!currentPoint) return loads.map((l) => l.id);

  // Nearest neighbor algorithm
  while (visited.size < loads.length * 2 && currentPoint) {
    if (currentPoint === 'start') {
      // Find nearest pickup
      const pickups = allPoints.filter((p) => p.type === 'pickup' && p.id !== 'start' && !visited.has(p.loadId));
      if (pickups.length === 0) break;

      const startDistances = distances[currentPoint];
      if (!startDistances) break;

      let nearest = pickups[0];
      if (!nearest?.id) break;
      let minDist = startDistances[nearest.id] ?? Infinity;

      pickups.forEach((pickup) => {
        if (!pickup.id) return;
        const dist = startDistances[pickup.id] ?? Infinity;
        if (dist < minDist) {
          minDist = dist;
          nearest = pickup;
        }
      });

      currentPoint = nearest.id;
      visited.add(nearest.loadId);
      optimizedSequence.push(nearest.loadId);
    } else {
      const point = allPoints.find((p) => p.id === currentPoint);
      if (!point) break;

      const currentDistances = distances[currentPoint];
      if (!currentDistances) break;

      if (point.type === 'pickup' && !visited.has(`delivery-${point.loadId}`)) {
        // Go to delivery
        currentPoint = `delivery-${point.loadId}`;
        visited.add(`delivery-${point.loadId}`);
      } else {
        // Find next nearest pickup
        const pickups = allPoints.filter(
          (p) => p.type === 'pickup' && p.id !== 'start' && !visited.has(p.loadId)
        );
        if (pickups.length === 0) break;

        let nearest = pickups[0];
        if (!nearest?.id) break;
        let minDist = currentDistances[nearest.id] ?? Infinity;

        pickups.forEach((pickup) => {
          if (!pickup.id) return;
          const dist = currentDistances[pickup.id] ?? Infinity;
          if (dist < minDist) {
            minDist = dist;
            nearest = pickup;
          }
        });

        currentPoint = nearest.id;
        visited.add(nearest.loadId);
        optimizedSequence.push(nearest.loadId);
      }
    }
  }

  return optimizedSequence;
}

function calculateDistance(
  point1: { city: string; state: string },
  point2: { city: string; state: string }
): number {
  // Simplified - same state = 200 miles, different state = 500 miles
  // In production, use Google Maps Distance Matrix API
  if (point1.state === point2.state) {
    return point1.city === point2.city ? 0 : 200;
  }
  return 500;
}

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
    const validated = optimizeRouteSchema.parse(body);

    // Fetch loads
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        pickupDate: true,
        deliveryDate: true,
        revenue: true,
        totalMiles: true,
        route: {
          select: {
            totalDistance: true,
          },
        },
      },
    });

    if (loads.length !== validated.loadIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LOADS',
            message: 'Some loads not found or do not belong to your company',
          },
        },
        { status: 400 }
      );
    }

    // Filter out loads with missing required location data
    const validLoads = loads.filter(
      (load) => 
        load.pickupCity && load.pickupState && 
        load.deliveryCity && load.deliveryState &&
        load.pickupDate && load.deliveryDate
    );

    if (validLoads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LOADS',
            message: 'All loads are missing required location or date information',
          },
        },
        { status: 400 }
      );
    }

    // Optimize route
    const optimizedSequence = optimizeRoute(
      validLoads.map((load) => {
        // TypeScript now knows these are non-null after filtering
        const pickupCity = load.pickupCity!;
        const pickupState = load.pickupState!;
        const deliveryCity = load.deliveryCity!;
        const deliveryState = load.deliveryState!;
        const pickupDate = load.pickupDate!;
        const deliveryDate = load.deliveryDate!;
        
        return {
          id: load.id,
          pickupCity,
          pickupState,
          deliveryCity,
          deliveryState,
          pickupDate,
          deliveryDate,
          revenue: load.revenue,
          distance: load.totalMiles ?? undefined,
        };
      }),
      validated.optimizationType,
      validated.startLocation
    );

    // Calculate total distance and estimated time
    let totalDistance = 0;
    const waypoints: Array<{ loadId: string; city: string; state: string; type: 'pickup' | 'delivery' }> = [];

    for (let i = 0; i < optimizedSequence.length; i++) {
      const loadId = optimizedSequence[i];
      const load = validLoads.find((l) => l.id === loadId);
      if (!load || !load.pickupCity || !load.pickupState || !load.deliveryCity || !load.deliveryState) continue;

      waypoints.push({
        loadId,
        city: load.pickupCity,
        state: load.pickupState,
        type: 'pickup',
      });

      // Add delivery
      waypoints.push({
        loadId,
        city: load.deliveryCity,
        state: load.deliveryState,
        type: 'delivery',
      });

      // Add distance (simplified)
      totalDistance += load.route?.totalDistance || load.totalMiles || 500;
    }

    // Calculate estimated time (assuming 55 mph average)
    const estimatedTime = totalDistance / 55; // hours

    // Calculate estimated fuel cost (assuming $0.50/mile)
    const estimatedFuelCost = totalDistance * 0.5;

    return NextResponse.json({
      success: true,
      data: {
        optimizedSequence,
        waypoints,
        metrics: {
          totalDistance: parseFloat(totalDistance.toFixed(0)),
          estimatedTime: parseFloat(estimatedTime.toFixed(1)),
          estimatedFuelCost: parseFloat(estimatedFuelCost.toFixed(2)),
          totalLoads: optimizedSequence.length,
        },
        loads: loads.map((load) => ({
          id: load.id,
          loadNumber: load.loadNumber,
          pickupCity: load.pickupCity,
          pickupState: load.pickupState,
          deliveryCity: load.deliveryCity,
          deliveryState: load.deliveryState,
        })),
      },
      message: 'Route optimized successfully. Note: Using simplified distance calculation. Integrate Google Maps API for accurate routing.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Route optimization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

