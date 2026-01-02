import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Mobile app authentication endpoint
 * Drivers can log in with email/password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Normalize email (lowercase and trim)
    const normalizedEmail = validated.email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        drivers: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(validated.password, user.password);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        },
        { status: 401 }
      );
    }

    // Check if user is a driver
    const driver = user.drivers[0];
    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    // Check if driver is active
    if (!driver.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INACTIVE_DRIVER', message: 'Driver account is inactive' },
        },
        { status: 403 }
      );
    }

    // Return driver info (without sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        driver: {
          id: driver.id,
          driverNumber: driver.driverNumber,
          status: driver.status,
          licenseNumber: driver.licenseNumber,
          licenseState: driver.licenseState,
        },
        company: {
          id: driver.companyId,
          name: driver.company.name,
        },
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

    console.error('Mobile auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

