import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Combined schema for flat frontend form
const updateCompanySchema = z.object({
  // Basic Info (Company table)
  name: z.string().min(1).optional(),
  dotNumber: z.string().optional(),
  mcNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),

  // Branding (appearanceSettings)
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),

  // Email (notificationSettings)
  emailFromName: z.string().optional(),
  emailFromAddress: z.string().email().optional(),
  emailSignature: z.string().optional(),

  // Invoice (generalSettings)
  invoiceHeader: z.string().optional(),
  invoiceFooter: z.string().optional(),
  invoiceTerms: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Fetch Company AND Settings
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      include: {
        mcNumbers: { select: { id: true, number: true, type: true, isDefault: true } }
      }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } },
        { status: 404 }
      );
    }

    // Fetch or Create CompanySettings
    let settings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId }
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { companyId: session.user.companyId }
      });
    }

    // Parse JSON fields safely
    const appearance = (settings.appearanceSettings as any) || {};
    const notification = (settings.notificationSettings as any) || {};
    const general = (settings.generalSettings as any) || {};

    // Merge into flat structure for frontend
    const mergedData = {
      ...company,
      logoUrl: appearance.logoUrl || '',
      primaryColor: appearance.primaryColor || '#3b82f6',
      secondaryColor: appearance.secondaryColor || '#8b5cf6',
      emailFromName: notification.emailFromName || '',
      emailFromAddress: notification.emailFromAddress || '',
      emailSignature: notification.emailSignature || '',
      invoiceHeader: general.invoiceHeader || '',
      invoiceFooter: general.invoiceFooter || '',
      invoiceTerms: general.invoiceTerms || '',
    };

    return NextResponse.json({
      success: true,
      data: mergedData,
    });
  } catch (error) {
    console.error('Company fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can update company settings' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateCompanySchema.parse(body);

    const {
      // Extract Company fields
      name, dotNumber, mcNumber, address, city, state, zip, phone, email,
      // Extract Settings fields
      logoUrl, primaryColor, secondaryColor,
      emailFromName, emailFromAddress, emailSignature,
      invoiceHeader, invoiceFooter, invoiceTerms
    } = validated;

    // 1. Update Company Table (if basic info provided)
    // We only update fields that are present in the payload
    const companyData: any = {};
    if (name) companyData.name = name;
    if (dotNumber) companyData.dotNumber = dotNumber;
    if (address) companyData.address = address;
    if (city) companyData.city = city;
    if (state) companyData.state = state;
    if (zip) companyData.zip = zip;
    if (phone) companyData.phone = phone;
    if (email) companyData.email = email;
    // Note: mcNumber logic might be complex with McNumber model, but keeping as string field for now based on schema fallback

    if (Object.keys(companyData).length > 0) {
      await prisma.company.update({
        where: { id: session.user.companyId },
        data: companyData,
      });
    }

    // 2. Update CompanySettings Table
    // We need to fetch existing settings to merge, or just overwrite? 
    // Best practice with Prisma JSON is typically read-modify-write or deep merge if partials supported.
    // For simplicity, we will merge with existing.

    const existingSettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId }
    });

    const currentAppearance = (existingSettings?.appearanceSettings as any) || {};
    const currentNotification = (existingSettings?.notificationSettings as any) || {};
    const currentGeneral = (existingSettings?.generalSettings as any) || {};

    const newAppearance = {
      ...currentAppearance,
      ...(logoUrl !== undefined && { logoUrl }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(secondaryColor !== undefined && { secondaryColor }),
    };

    const newNotification = {
      ...currentNotification,
      ...(emailFromName !== undefined && { emailFromName }),
      ...(emailFromAddress !== undefined && { emailFromAddress }),
      ...(emailSignature !== undefined && { emailSignature }),
    };

    const newGeneral = {
      ...currentGeneral,
      ...(invoiceHeader !== undefined && { invoiceHeader }),
      ...(invoiceFooter !== undefined && { invoiceFooter }),
      ...(invoiceTerms !== undefined && { invoiceTerms }),
    };

    await prisma.companySettings.upsert({
      where: { companyId: session.user.companyId },
      create: {
        companyId: session.user.companyId,
        appearanceSettings: newAppearance,
        notificationSettings: newNotification,
        generalSettings: newGeneral,
      },
      update: {
        appearanceSettings: newAppearance,
        notificationSettings: newNotification,
        generalSettings: newGeneral,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Company update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

