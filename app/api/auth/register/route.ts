import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validations/auth';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // For now, we need a company. In production, this would be handled differently.
    // For MVP, we'll use the first company or create a demo company
    let company = await prisma.company.findFirst();

    if (!company) {
      // Create a demo company for registration
      company = await prisma.company.create({
        data: {
          name: 'New Company',
          dotNumber: `DOT-${Date.now()}`,
          address: 'TBD',
          city: 'TBD',
          state: 'TX',
          zip: '00000',
          phone: validated.phone || '000-0000',
          email: validated.email,
        },
      });
    }

    // Get or create default MC number for the company
    let mcNumber = await prisma.mcNumber.findFirst({
      where: {
        companyId: company.id,
        isDefault: true,
      },
    });

    if (!mcNumber) {
      // Create a default MC number
      mcNumber = await prisma.mcNumber.create({
        data: {
          companyId: company.id,
          number: company.mcNumber || `MC-${Date.now()}`,
          companyName: company.name,
          type: 'CARRIER',
          isDefault: true,
        },
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone && validated.phone.trim() !== '' ? validated.phone : null,
        role: 'DISPATCHER', // Default role for new registrations
        companyId: company.id,
        mcNumberId: mcNumber.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    );
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

    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      },
      { status: 500 }
    );
  }
}

