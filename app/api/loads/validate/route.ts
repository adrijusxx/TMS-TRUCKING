import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import {
  LoadValidationManager,
  type ValidationResult,
  type DuplicateResult,
} from '@/lib/managers/LoadValidationManager';

const validateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  driverId: z.string().optional().nullable(),
  equipmentType: z.enum([
    'DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK',
    'LOWBOY', 'TANKER', 'CONESTOGA', 'POWER_ONLY', 'HOTSHOT',
  ]),
  commodity: z.string().optional().nullable(),
  hazmat: z.boolean().optional().default(false),
  pickupCity: z.string().optional().nullable(),
  pickupState: z.string().optional().nullable(),
  deliveryCity: z.string().optional().nullable(),
  deliveryState: z.string().optional().nullable(),
  pickupDate: z.string().optional().nullable(),
  revenue: z.number().optional(),
});

/**
 * POST /api/loads/validate
 * Pre-creation validation + duplicate detection for a new load.
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

    if (!hasPermission(session.user.role as any, 'loads.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const companyId = session.user.companyId;

    // Run validation and duplicate detection in parallel
    const [validation, duplicates] = await Promise.all([
      LoadValidationManager.validatePreCreation({
        ...input,
        companyId,
        equipmentType: input.equipmentType as any,
      }),
      LoadValidationManager.detectDuplicates(
        companyId,
        input.customerId,
        input.pickupCity,
        input.pickupState,
        input.deliveryCity,
        input.deliveryState,
        input.pickupDate
      ),
    ]);

    // Add duplicate warning if found
    if (duplicates.hasDuplicates) {
      validation.warnings.push(
        `Potential duplicate load(s) found: ${duplicates.matchingLoadNumbers.join(', ')}. ` +
        `Same customer, route, and pickup date.`
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        validation,
        duplicates,
      } satisfies { validation: ValidationResult; duplicates: DuplicateResult },
    });
  } catch (error: any) {
    console.error('Error validating load:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to validate load',
        },
      },
      { status: 500 }
    );
  }
}
