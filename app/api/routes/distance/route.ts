import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { calculateDistanceMatrix } from '@/lib/maps/google-maps';
import { z } from 'zod';

const distanceRequestSchema = z.object({
  origins: z.array(
    z.union([
      z.object({ city: z.string(), state: z.string() }),
      z.object({ lat: z.number(), lng: z.number() }),
    ])
  ).min(1),
  destinations: z.array(
    z.union([
      z.object({ city: z.string(), state: z.string() }),
      z.object({ lat: z.number(), lng: z.number() }),
    ])
  ).min(1),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).optional(),
  units: z.enum(['imperial', 'metric']).optional(),
});

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
    const validated = distanceRequestSchema.parse(body);

    const results = await calculateDistanceMatrix({
      origins: validated.origins,
      destinations: validated.destinations,
      mode: validated.mode,
      units: validated.units,
    });

    // Convert to more readable format
    const formattedResults = results.map((row, originIdx) =>
      row.map((cell, destIdx) => ({
        origin: validated.origins[originIdx],
        destination: validated.destinations[destIdx],
        distance: {
          meters: cell.distance,
          miles: parseFloat((cell.distance * 0.000621371).toFixed(2)),
          kilometers: parseFloat((cell.distance / 1000).toFixed(2)),
        },
        duration: {
          seconds: cell.duration,
          minutes: parseFloat((cell.duration / 60).toFixed(1)),
          hours: parseFloat((cell.duration / 3600).toFixed(2)),
        },
        durationInTraffic: cell.durationInTraffic
          ? {
              seconds: cell.durationInTraffic,
              minutes: parseFloat((cell.durationInTraffic / 60).toFixed(1)),
              hours: parseFloat((cell.durationInTraffic / 3600).toFixed(2)),
            }
          : undefined,
        status: cell.status,
      }))
    );

    return NextResponse.json({
      success: true,
      data: formattedResults,
      note: process.env.GOOGLE_MAPS_API_KEY
        ? 'Using Google Maps API'
        : 'Using simplified distance calculation (Google Maps API key not configured)',
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

    console.error('Distance calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

