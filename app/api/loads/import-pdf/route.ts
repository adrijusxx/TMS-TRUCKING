/**
 * Rate Confirmation PDF Import API
 * 
 * Implements the "Hybrid Rate Con Parser" from OPERATIONAL_OVERHAUL spec.
 * Uses "Draft First" approach for fast ingestion (<3s target).
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getRateConParserService } from '@/lib/services/RateConParserService';

// ============================================
// TYPES
// ============================================

interface ImportResponse {
  success: boolean;
  data?: Record<string, unknown>;
  meta?: {
    customerMatched: boolean;
    customerCreated: boolean;
    extractedFields: number;
    confidence: 'high' | 'medium' | 'low';
    accountingWarnings: string[];
    processingTimeMs: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<ImportResponse>> {
  const startTime = Date.now();
  
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Validate file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    const fileError = validateFile(file);
    if (fileError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: fileError } },
        { status: 400 }
      );
    }

    // 3. Extract PDF content using the RateConParserService
    const buffer = Buffer.from(await file.arrayBuffer());
    const parserService = getRateConParserService();
    const parseResult = await parserService.parseRateCon(buffer);
    
    if (!parseResult.success || !parseResult.loadFormData) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'EXTRACTION_ERROR', 
            message: parseResult.error || 'Failed to extract data from PDF' 
          } 
        },
        { status: 400 }
      );
    }

    // 4. Match or create customer
    const customerResult = await matchOrCreateCustomer(
      parseResult.loadFormData.customerName as string | undefined,
      session.user.companyId
    );

    // 5. Build response data
    const responseData = {
      ...parseResult.loadFormData,
      customerId: customerResult.customerId,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        customerMatched: customerResult.matched,
        customerCreated: customerResult.created,
        extractedFields: parseResult.meta.extractedFieldCount,
        confidence: parseResult.meta.confidence,
        accountingWarnings: parseResult.warnings,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('[PDF Import] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process PDF',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate uploaded file
 */
function validateFile(file: File | null): string | null {
  if (!file) {
    return 'No file provided';
  }
  if (file.type !== 'application/pdf') {
    return 'File must be a PDF';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File size must be less than 10MB';
  }
  return null;
}

/**
 * Match existing customer or create new one
 */
async function matchOrCreateCustomer(
  customerName: string | undefined,
  companyId: string
): Promise<{ customerId?: string; matched: boolean; created: boolean }> {
  if (!customerName) {
    return { matched: false, created: false };
  }

  // Try exact match first
  let customer = await prisma.customer.findFirst({
    where: {
      companyId,
      name: { equals: customerName, mode: Prisma.QueryMode.insensitive },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (customer) {
    return { customerId: customer.id, matched: true, created: false };
  }

  // Try partial match
  customer = await prisma.customer.findFirst({
    where: {
      companyId,
      name: { contains: customerName, mode: Prisma.QueryMode.insensitive },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (customer) {
    return { customerId: customer.id, matched: true, created: false };
  }

  // Create new customer
  try {
    const newCustomer = await prisma.customer.create({
      data: {
        companyId,
        name: customerName,
        customerNumber: `CUST-${Date.now()}`,
        type: 'BROKER',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        isActive: true,
        paymentTerms: 30,
      },
      select: { id: true },
    });
    return { customerId: newCustomer.id, matched: false, created: true };
  } catch (error) {
    console.error('[PDF Import] Failed to create customer:', error);
    return { matched: false, created: false };
  }
}
