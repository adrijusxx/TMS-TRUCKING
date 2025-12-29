import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { calculateRoute as calculateGoogleRoute } from '@/lib/maps/google-maps';
import { z } from 'zod';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteMetrics {
  distanceMiles: number;
  durationMinutes: number;
  fuelCost: number;
  waypoints: Coordinates[];
  provider: 'google' | 'fallback';
  polyline?: string | null;
  bounds?: unknown;
}

const calculateRouteSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  deliveryLat: z.number(),
  deliveryLng: z.number(),
  loadId: z.string().cuid().optional(),
});

class RouteCalculationService {
  private readonly pickup: Coordinates;
  private readonly delivery: Coordinates;

  constructor(pickup: Coordinates, delivery: Coordinates) {
    this.pickup = pickup;
    this.delivery = delivery;
  }

  async calculate(): Promise<RouteMetrics> {
    const googleRoute = await this.calculateWithGoogle().catch((error) => {
      console.error('Google route calculation failed, falling back:', error);
      return null;
    });

    if (googleRoute) {
      return googleRoute;
    }

    return this.calculateFallback();
  }

  private async calculateWithGoogle(): Promise<RouteMetrics | null> {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return null;
    }

    const result = await calculateGoogleRoute([this.pickup, this.delivery]);
    if (!result) {
      return null;
    }

    const distanceMiles = parseFloat((result.distance * 0.000621371).toFixed(2));
    const durationMinutes = Math.round(result.duration / 60);

    return {
      distanceMiles,
      durationMinutes,
      fuelCost: this.estimateFuelCost(distanceMiles),
      waypoints: [this.pickup, this.delivery],
      provider: 'google',
      polyline: result.polyline,
      bounds: result.bounds,
    };
  }

  private calculateFallback(): RouteMetrics {
    const earthRadiusMiles = 3959;
    const dLat = this.deg2rad(this.delivery.lat - this.pickup.lat);
    const dLon = this.deg2rad(this.delivery.lng - this.pickup.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(this.pickup.lat)) *
        Math.cos(this.deg2rad(this.delivery.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMiles = parseFloat((earthRadiusMiles * c).toFixed(2));
    const durationMinutes = Math.round((distanceMiles / 55) * 60);

    return {
      distanceMiles,
      durationMinutes,
      fuelCost: this.estimateFuelCost(distanceMiles),
      waypoints: [this.pickup, this.delivery],
      provider: 'fallback',
      polyline: null,
      bounds: null,
    };
  }

  private deg2rad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private estimateFuelCost(distanceMiles: number): number {
    return parseFloat(((distanceMiles / 6) * 3.5).toFixed(2));
  }
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
    const validated = calculateRouteSchema.parse(body);

    const pickup: Coordinates = { lat: validated.pickupLat, lng: validated.pickupLng };
    const delivery: Coordinates = { lat: validated.deliveryLat, lng: validated.deliveryLng };

    const calculator = new RouteCalculationService(pickup, delivery);
    const metrics = await calculator.calculate();

    if (validated.loadId) {
      const load = await prisma.load.findFirst({
        where: {
          id: validated.loadId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (load) {
        await prisma.route.upsert({
          where: { loadId: validated.loadId },
          update: {
            totalDistance: metrics.distanceMiles,
            estimatedTime: metrics.durationMinutes,
            fuelCost: metrics.fuelCost,
            waypoints: metrics.waypoints as any,
            optimized: false,
            updatedAt: new Date(),
          },
          create: {
            loadId: validated.loadId,
            totalDistance: metrics.distanceMiles,
            estimatedTime: metrics.durationMinutes,
            fuelCost: metrics.fuelCost,
            waypoints: metrics.waypoints as any,
            optimized: false,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        distance: metrics.distanceMiles,
        estimatedTime: metrics.durationMinutes,
        fuelCost: metrics.fuelCost,
        waypoints: metrics.waypoints,
        provider: metrics.provider,
        polyline: metrics.polyline,
      },
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

    console.error('Route calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

