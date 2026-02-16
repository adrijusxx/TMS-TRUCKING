import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validations/auth';
import { TurnstileService } from '@/lib/services/TurnstileService';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Turnstile CAPTCHA (if token provided)
    if (body.turnstileToken) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
      const turnstileResult = await TurnstileService.verify(body.turnstileToken, ip);

      if (!turnstileResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CAPTCHA_FAILED',
              message: turnstileResult.message || 'CAPTCHA verification failed',
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate input
    const validated = registerSchema.parse(body);

    // Normalize email to lowercase (auth queries use lowercase)
    const normalizedEmail = validated.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    // Check if DOT number already registered
    const existingCompany = await prisma.company.findFirst({
      where: { dotNumber: validated.dotNumber },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A company with this DOT number is already registered',
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Determine subscription based on plan (from Step 4)
    const plan = body.plan as string | undefined;
    console.log('[Register] Plan selected:', plan); // DEBUG LOG

    const isOwnerOperator = plan === 'owner_operator';
    const subscriptionStatus = isOwnerOperator ? 'OWNER_OPERATOR' : 'TRIALING';
    const truckLimit = isOwnerOperator ? 1 : 999;
    const trialEndsAt = isOwnerOperator ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // ...

    // For registration, we ALWAYS create a new company for the new user.
    // They are signing up as a NEW tenant.
    let company = await prisma.company.create({
      data: {
        name: validated.companyName,
        dotNumber: validated.dotNumber,
        address: 'P.O. Box (Update in Settings)',
        city: 'Update in Settings',
        state: 'TX',
        zip: '00000',
        phone: validated.phone || '000-0000',
        email: validated.email,
        subscriptionStatus: subscriptionStatus,
        truckLimit: truckLimit,
        trialEndsAt: trialEndsAt,
        onboardingComplete: true,
        isReadOnly: false,
      },
    });

    // Initialize Subscription with usage limits
    const usageLimits = isOwnerOperator
      ? {
        usageBased: true,
        loadsLimit: 10,
        invoicesLimit: 5,
        settlementsLimit: 3,
        documentsLimit: 5,
        trucksLimit: 1,
        driversLimit: 2,
      }
      : {
        usageBased: false, // Pro trial = unlimited
        loadsLimit: null,
        invoicesLimit: null,
        settlementsLimit: null,
        documentsLimit: null,
        trucksLimit: null,
        driversLimit: null,
      };

    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: isOwnerOperator ? 'owner-operator-free' : 'pro-trial-14day',
        status: subscriptionStatus,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt || new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        ...usageLimits,
      },
    });

    // Create default MC number
    let mcNumber = await prisma.mcNumber.create({
      data: {
        companyId: company.id,
        number: validated.mcNumber,
        companyName: company.name,
        type: 'CARRIER',
        isDefault: true,
      },
    });

    // Create user as ADMIN (Company Owner)
    const userData = {
      email: normalizedEmail, // Use normalized email for consistent lookup
      password: hashedPassword,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone && validated.phone.trim() !== '' ? validated.phone : null,
      role: 'ADMIN' as const, // First user is the Admin
      companyId: company.id,
      mcNumberId: mcNumber.id,
      mcAccess: [mcNumber.id],
    };

    const user = await prisma.user.create({
      data: userData as any,
    });

    // Process imported data (best-effort: pre-mapped rows, same importers as onboarding)
    const importedData = body.importedData as Record<string, any[]> | undefined;
    const importOrder: Array<'drivers' | 'trucks' | 'trailers' | 'customers' | 'loads'> = ['drivers', 'trucks', 'trailers', 'customers', 'loads'];
    if (importedData && Object.keys(importedData).length > 0) {
      const companyId = company.id;
      const userId = user.id;
      const currentMcNumber = validated.mcNumber?.trim() || mcNumber.number;

      const [{ DriverImporter }, { TruckImporter }, { TrailerImporter }, { CustomerImporter }, { LoadImporter }] = await Promise.all([
        import('@/lib/managers/import/DriverImporter'),
        import('@/lib/managers/import/TruckImporter'),
        import('@/lib/managers/import/TrailerImporter'),
        import('@/lib/managers/import/CustomerImporter'),
        import('@/lib/managers/import/LoadImporter'),
      ]);

      for (const entityType of importOrder) {
        const rows = importedData[entityType];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        try {
          let importer: InstanceType<typeof DriverImporter> | InstanceType<typeof TruckImporter> | InstanceType<typeof TrailerImporter> | InstanceType<typeof CustomerImporter> | InstanceType<typeof LoadImporter>;
          switch (entityType) {
            case 'drivers':
              importer = new DriverImporter(prisma, companyId, userId);
              break;
            case 'trucks':
              importer = new TruckImporter(prisma, companyId, userId);
              break;
            case 'trailers':
              importer = new TrailerImporter(prisma, companyId, userId);
              break;
            case 'customers':
              importer = new CustomerImporter(prisma, companyId, userId);
              break;
            case 'loads':
              importer = new LoadImporter(prisma, companyId, userId);
              break;
            default:
              continue;
          }

          await importer.import(rows, {
            previewOnly: false,
            updateExisting: false,
            columnMapping: {},
            currentMcNumber,
          });
        } catch (importErr) {
          console.error(`[Register] Import failed for ${entityType}:`, importErr);
          // Best-effort: do not block registration
        }
      }
    }

    // Send welcome email (asynchronously, don't block response)
    // We import dynamically to avoid circular dependency issues if any, though regular import is likely fine here
    try {
      const { EmailService } = await import('@/lib/services/EmailService');
      // Fire and forget - don't await this to keep registration fast
      EmailService.sendWelcomeEmail(user.email, user.firstName).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    } catch (emailError) {
      console.error('Error initiating email service:', emailError);
    }

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

