import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIRateRecommender } from '@/lib/services/AIRateRecommender';
import { AIVerificationService } from '@/lib/services/AIVerificationService';
import { z } from 'zod';

const rateRecommendationSchema = z.object({
  pickupCity: z.string().min(1, 'Pickup city is required'),
  pickupState: z.string().length(2, 'Pickup state must be 2 characters'),
  deliveryCity: z.string().min(1, 'Delivery city is required'),
  deliveryState: z.string().length(2, 'Delivery state must be 2 characters'),
  equipmentType: z.string().min(1, 'Equipment type is required'),
  weight: z.number().optional(),
  hazmat: z.boolean().optional(),
  temperature: z.string().optional(),
  totalMiles: z.number().optional(),
  loadId: z.string().optional(), // Optional: if creating for existing load
  createSuggestion: z.boolean().optional().default(true), // Whether to create suggestion requiring approval
});

const verificationService = new AIVerificationService();

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
    const validated = rateRecommendationSchema.parse(body);

    const recommender = new AIRateRecommender();
    const recommendation = await recommender.getRateRecommendation({
      ...validated,
      companyId: session.user.companyId,
    });

    // If createSuggestion is true, create a suggestion requiring approval
    if (validated.createSuggestion) {
      const suggestion = await verificationService.createSuggestion({
        companyId: session.user.companyId,
        suggestionType: 'RATE_RECOMMENDATION',
        entityType: 'LOAD',
        entityId: validated.loadId || undefined,
        aiConfidence: recommendation.confidence,
        aiReasoning: recommendation.reasoning,
        suggestedValue: {
          revenue: recommendation.recommendedRate,
          ratePerMile: recommendation.ratePerMile,
        },
        originalValue: validated.loadId ? await getLoadOriginalValue(validated.loadId) : undefined,
      });

      return NextResponse.json({
        success: true,
        data: {
          ...recommendation,
          suggestionId: suggestion.id,
          requiresApproval: true,
        },
      });
    }

    // Return recommendation without creating suggestion (for preview)
    return NextResponse.json({
      success: true,
      data: {
        ...recommendation,
        requiresApproval: false,
      },
    });
  } catch (error) {
    console.error('AI rate recommendation error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get rate recommendation',
        },
      },
      { status: 500 }
    );
  }
}

async function getLoadOriginalValue(loadId: string) {
  const { prisma } = await import('@/lib/prisma');
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    select: { revenue: true, driverPay: true, totalExpenses: true, fuelAdvance: true },
  });
  return load || null;
}

