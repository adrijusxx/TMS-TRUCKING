import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getTemplates, createLoadFromTemplate } from '@/lib/load-templates';
import { z } from 'zod';

const createFromTemplateSchema = z.object({
  templateId: z.string(),
  pickupDate: z.string().or(z.date()).optional(),
  deliveryDate: z.string().or(z.date()).optional(),
  revenue: z.number().optional(),
  weight: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * Get all load templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const templates = await getTemplates(session.user.companyId);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Load templates error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * Create a load from a template
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
    const validated = createFromTemplateSchema.parse(body);

    const pickupDate = validated.pickupDate
      ? new Date(validated.pickupDate)
      : undefined;
    const deliveryDate = validated.deliveryDate
      ? new Date(validated.deliveryDate)
      : undefined;

    const load = await createLoadFromTemplate(session.user.companyId, validated.templateId, {
      pickupDate,
      deliveryDate,
      revenue: validated.revenue,
      weight: validated.weight,
      notes: validated.notes,
    });

    return NextResponse.json({
      success: true,
      data: load,
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

    console.error('Create load from template error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

