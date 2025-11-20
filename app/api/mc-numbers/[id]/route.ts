import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMcNumberSchema = z.object({
  companyName: z.string().min(1).optional(),
  type: z.enum(['CARRIER', 'BROKER']).optional(),
  companyPhone: z.string().optional(),
  owner: z.string().optional(),
  isDefault: z.boolean().optional(),
  usdot: z.string().optional(),
  notes: z.string().optional(),
  number: z.string().min(1).optional(),
});

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

    const { id } = await params;

    const mcNumber = await prisma.mcNumber.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!mcNumber) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'MC number not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mcNumber,
    });
  } catch (error) {
    console.error('MC Number fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Only admins can edit MC numbers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can edit MC numbers' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateMcNumberSchema.parse(body);

    // Verify MC number belongs to user's company
    const existing = await prisma.mcNumber.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'MC number not found' },
        },
        { status: 404 }
      );
    }

    // Handle MC number field - only check for duplicates if the number actually changed
    if (validatedData.number !== undefined) {
      // Normalize both numbers (trim whitespace) to handle whitespace differences
      const normalizedNewNumber = validatedData.number.trim();
      const normalizedExistingNumber = existing.number.trim();
      
      // If the normalized numbers are the same, the number hasn't changed
      // Remove it from the update to avoid unnecessary database writes
      if (normalizedNewNumber === normalizedExistingNumber) {
        // Number hasn't actually changed, remove it from update
        delete validatedData.number;
      } else {
        // Number has changed, check for duplicates with the new number
        const duplicate = await prisma.mcNumber.findFirst({
          where: {
            companyId: session.user.companyId,
            number: normalizedNewNumber,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'DUPLICATE',
                message: 'MC number already exists for this company',
              },
            },
            { status: 400 }
          );
        }
        
        // Update the validated data with normalized number
        validatedData.number = normalizedNewNumber;
      }
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault === true) {
      await prisma.mcNumber.updateMany({
        where: {
          companyId: session.user.companyId,
          isDefault: true,
          id: { not: id },
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Only update fields that were actually provided
    const updateData: any = {};
    if (validatedData.companyName !== undefined) updateData.companyName = validatedData.companyName;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.companyPhone !== undefined) updateData.companyPhone = validatedData.companyPhone;
    if (validatedData.owner !== undefined) updateData.owner = validatedData.owner;
    if (validatedData.isDefault !== undefined) updateData.isDefault = validatedData.isDefault;
    if (validatedData.usdot !== undefined) updateData.usdot = validatedData.usdot;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.number !== undefined) updateData.number = validatedData.number;

    // Only update if there are actual changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'No changes detected',
      });
    }

    const mcNumber = await prisma.mcNumber.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: mcNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('MC Number update error:', error);
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE',
              message: 'MC number already exists for this company. Please use a different number.',
            },
          },
          { status: 400 }
        );
      }
      
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'COMPANY_NOT_FOUND',
              message: 'Your company was not found. The database may have been reset. Please log out and log back in, or contact support.',
            },
          },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Something went wrong' 
        },
      },
      { status: 500 }
    );
  }
}

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

    // Only admins can delete MC numbers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can delete MC numbers' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify MC number belongs to user's company
    const existing = await prisma.mcNumber.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'MC number not found' },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.mcNumber.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isDefault: false, // Unset default if deleting default MC number
      },
    });

    return NextResponse.json({
      success: true,
      message: 'MC number deleted successfully',
    });
  } catch (error) {
    console.error('MC Number delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}
