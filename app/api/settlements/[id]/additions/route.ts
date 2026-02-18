import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAdditionSchema = z.object({
  deductionType: z.enum(['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
});

// GET - List all additions for a settlement (additions saved as SettlementDeduction with addition types)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const settlementId = resolvedParams.id;

    // Verify settlement belongs to company
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    // Get additions (SettlementDeduction records with category 'addition')
    const additions = await prisma.settlementDeduction.findMany({
      where: {
        settlementId,
        category: 'addition',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: additions,
    });
  } catch (error) {
    console.error('Additions fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

// POST - Create a new addition
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const settlementId = resolvedParams.id;

    // Verify settlement belongs to company
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = createAdditionSchema.parse(body);

    // Create addition (stored as SettlementDeduction with addition type)
    const addition = await prisma.settlementDeduction.create({
      data: {
        settlementId,
        deductionType: validated.deductionType,
        category: 'addition', // Explicitly mark as addition
        description: validated.description,
        amount: validated.amount,
      },
    });

    // Recalculate settlement totals
    // Get all deductions
    const allDeductions = await prisma.settlementDeduction.findMany({
      where: {
        settlementId,
        category: 'deduction',
      },
    });
    const totalDeductions = allDeductions.reduce((sum, d) => sum + d.amount, 0);

    // Get all additions
    const allAdditions = await prisma.settlementDeduction.findMany({
      where: {
        settlementId,
        category: 'addition',
      },
    });
    const totalAdditions = allAdditions.reduce((sum, a) => sum + a.amount, 0);

    // Get advances
    const advances = await prisma.driverAdvance.findMany({
      where: { settlementId },
    });
    const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

    // CRITICAL FIX: netPay = grossPay + additions - deductions - advances
    const netPay = settlement.grossPay + totalAdditions - totalDeductions - totalAdvances;

    // Update settlement
    await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        deductions: totalDeductions,
        netPay: netPay < 0 ? 0 : netPay,
      },
    });

    return NextResponse.json({
      success: true,
      data: addition,
    }, { status: 201 });
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

    console.error('Addition creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an addition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const settlementId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const additionId = searchParams.get('additionId');

    if (!additionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Addition ID is required' },
        },
        { status: 400 }
      );
    }

    // Verify addition belongs to settlement and settlement belongs to company
    const addition = await prisma.settlementDeduction.findFirst({
      where: {
        id: additionId,
        settlementId,
        deductionType: {
          in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'],
        },
        settlement: {
          driver: {
            companyId: session.user.companyId,
          },
        },
      },
    });

    if (!addition) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Addition not found' },
        },
        { status: 404 }
      );
    }

    // Delete addition
    await prisma.settlementDeduction.delete({
      where: { id: additionId },
    });

    // Recalculate settlement totals
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (settlement) {
      // Get all deductions
      const allDeductions = await prisma.settlementDeduction.findMany({
        where: {
          settlementId,
          category: 'deduction',
        },
      });
      const totalDeductions = allDeductions.reduce((sum, d) => sum + d.amount, 0);

      // Get all additions
      const allAdditions = await prisma.settlementDeduction.findMany({
        where: {
          settlementId,
          category: 'addition',
        },
      });
      const totalAdditions = allAdditions.reduce((sum, a) => sum + a.amount, 0);

      // Get advances
      const advances = await prisma.driverAdvance.findMany({
        where: { settlementId },
      });
      const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

      // CRITICAL FIX: netPay = grossPay + additions - deductions - advances
      const netPay = settlement.grossPay + totalAdditions - totalDeductions - totalAdvances;

      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          deductions: totalDeductions,
          netPay: netPay < 0 ? 0 : netPay,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Addition deleted successfully',
    });
  } catch (error) {
    console.error('Addition deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}





