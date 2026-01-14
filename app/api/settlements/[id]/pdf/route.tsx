import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { join } from 'path';
import { SettlementPDF } from '@/lib/pdf/SettlementPDF';
import { SimpleSettlementPDF } from '@/lib/pdf/SimpleSettlementPDF';

// Disable static generation for this route
export const dynamic = 'force-dynamic';

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
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format'); // 'simple' or null/undefined for formal

    // Fetch settlement with related data
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },

          },
        },
        deductionItems: {
          select: {
            id: true,
            amount: true,
            description: true,
            deductionType: true,
            category: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
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

    // Debug logging for PDF categories
    console.log('[PDF] Fetching settlement items:', settlement.deductionItems.length);
    settlement.deductionItems.forEach(item => {
      console.log(`[PDF] Item: ${item.description}, Type: ${item.deductionType}, Category: ${item.category}, Amount: ${item.amount}`);
    });

    // Fetch company information
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });

    // Branding override logic
    const brandingCompany: any = { ...company }; // Use 'any' for flexibility with added 'hideName'

    // Helper to process logo URL for React-PDF (needs absolute path or public URL)
    const processLogoUrl = (url: string) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      if (url.startsWith('/')) {
        const absolutePath = join(process.cwd(), 'public', url);
        // console.log('Processing Logo Path:', absolutePath);
        return absolutePath;
      }
      return url;
    };

    // Attempt to find MC Number from driver
    console.log('[Settlement PDF] Driver ID:', settlement.driver.id);
    console.log('[Settlement PDF] Driver MC ID:', settlement.driver.mcNumberId);

    if (settlement.driver && settlement.driver.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findUnique({
        where: { id: settlement.driver.mcNumberId }
      });

      if (mcNumber) {
        console.log('[Settlement PDF] Found MC Number:', mcNumber.number);
        const branding = mcNumber.branding ? (typeof mcNumber.branding === 'string' ? JSON.parse(mcNumber.branding) : mcNumber.branding) : {};

        // Override fields
        if (mcNumber.logoUrl) brandingCompany.logoUrl = mcNumber.logoUrl;
        if (mcNumber.address) brandingCompany.address = mcNumber.address;
        if (mcNumber.city) brandingCompany.city = mcNumber.city;
        if (mcNumber.state) brandingCompany.state = mcNumber.state;
        if (mcNumber.zip) brandingCompany.zipCode = mcNumber.zip;
        if (mcNumber.email) brandingCompany.email = mcNumber.email;
        if (mcNumber.companyName) brandingCompany.name = mcNumber.companyName;

        if (branding.hideCompanyName) {
          console.log('[Settlement PDF] Hiding Company Name');
          brandingCompany.hideName = true;
        }
        if (branding.hideFooter) {
          brandingCompany.hideFooter = true;
        }
      }
    } else {
      console.log('[Settlement PDF] No MC ID found on driver.');
    }

    // Process the final logo URL (whether from company or MC override)
    if (brandingCompany.logoUrl) {
      brandingCompany.logoUrl = processLogoUrl(brandingCompany.logoUrl);
    }

    // Fetch loads if settlement has load IDs
    const loads = settlement.loadIds.length > 0
      ? await prisma.load.findMany({
        where: {
          id: { in: settlement.loadIds },
        },
        select: {
          id: true,
          loadNumber: true,
          pickupCity: true,
          pickupState: true,
          deliveryCity: true,
          deliveryState: true,
          revenue: true,
          driverPay: true,
          totalMiles: true,
          loadedMiles: true,
          emptyMiles: true,
          deliveredAt: true,
        },
      })
      : [];

    // Fetch advances
    const advances = await prisma.driverAdvance.findMany({
      where: {
        settlementId: settlement.id,
      },
      select: {
        id: true,
        amount: true,
        requestDate: true,
      },
    });

    // Fetch deduction rules for Recurring Status (Mirroring UI)
    const deductionRules = await prisma.deductionRule.findMany({
      where: {
        companyId: settlement.driver.companyId,
        isActive: true,
        OR: [
          { driverType: null },
          { driverType: settlement.driver.driverType || undefined },
        ],
      },
      select: {
        id: true,
        name: true,
        deductionType: true,
        amount: true,
        calculationType: true,
        percentage: true,
        perMileRate: true,
        frequency: true,
        goalAmount: true,
        currentAmount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    try {
      // Choose Component based on format
      let pdfComponent;
      if (format === 'simple') {
        pdfComponent = (
          <SimpleSettlementPDF
            settlement={settlement}
            company={brandingCompany}
            driver={settlement.driver}
            loads={loads}
            deductionItems={settlement.deductionItems || []}
            advances={advances}
          />
        );
      } else {
        pdfComponent = (
          <SettlementPDF
            settlement={settlement}
            company={brandingCompany}
            driver={settlement.driver}
            loads={loads}
            deductionItems={settlement.deductionItems || []}
            advances={advances}
            deductionRules={deductionRules}
          />
        );
      }

      // Generate PDF
      const pdfBuffer = await renderToBuffer(pdfComponent);

      // Convert buffer to proper format for NextResponse
      // renderToBuffer returns a Buffer or Uint8Array
      let pdfArray: Uint8Array;
      if (pdfBuffer instanceof Buffer) {
        pdfArray = new Uint8Array(pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength));
      } else if (pdfBuffer instanceof Uint8Array) {
        pdfArray = pdfBuffer;
      } else {
        pdfArray = new Uint8Array(await pdfBuffer);
      }

      const filename = format === 'simple'
        ? `settlement-${settlement.settlementNumber}-driver.pdf`
        : `settlement-${settlement.settlementNumber}.pdf`;

      // Return PDF as response - use slice to get plain ArrayBuffer
      return new NextResponse(pdfArray.buffer.slice(0) as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfArray.length.toString(),
        },
      });
    } catch (pdfError) {
      console.error('PDF rendering error:', pdfError);
      throw pdfError;
    }
  } catch (error) {
    console.error('Settlement PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to generate PDF' },
      },
      { status: 500 }
    );
  }
}

