
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import React from 'react';
import { join } from 'path';

// Disable static generation for this route
export const dynamic = 'force-dynamic';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000000',
    paddingBottom: 15,
  },
  companyInfo: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 10,
    objectFit: 'contain',
  },
  settlementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #000000',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1 solid #000000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #E5E7EB',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellNumber: {
    width: 80,
    textAlign: 'right',
    fontSize: 9,
  },
  tableCellSmall: {
    width: 60,
    fontSize: 8,
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 250,
    marginBottom: 5,
    padding: 5,
  },
  totalLabel: {
    flex: 1,
    fontWeight: 'bold',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    width: 250,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderTop: '2 solid #000000',
    borderBottom: '2 solid #000000',
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E5E7EB',
    fontSize: 8,
    color: '#6B7280',
  },
  negative: {
    color: '#DC2626',
  },
  positive: {
    color: '#16A34A',
  },
});

function SettlementPDF({ settlement, company, driver, loads, deductionItems, advances }: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPayType = (payType: string, payRate: number) => {
    switch (payType) {
      case 'PER_MILE':
        return `${formatCurrency(payRate)}/mile`;
      case 'PERCENTAGE':
        return `${payRate}% of revenue`;
      case 'PER_LOAD':
        return `${formatCurrency(payRate)}/load`;
      case 'HOURLY':
        return `${formatCurrency(payRate)}/hour`;
      default:
        return 'N/A';
    }
  };

  const totalMiles = loads.reduce((sum: number, load: any) => {
    return sum + (load.totalMiles || load.loadedMiles || load.emptyMiles || 0);
  }, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {company && (
              <>
                {company.logoUrl && (
                  <Image style={styles.logo} src={company.logoUrl} />
                )}
                {!company.hideName && (
                  <Text style={styles.companyName}>{company.name || 'Trucking Company'}</Text>
                )}
                {company.address && <Text>{company.address}</Text>}
                {company.city && company.state && (
                  <Text>
                    {company.city}, {company.state} {company.zipCode}
                  </Text>
                )}
                {company.phone && <Text>Phone: {company.phone}</Text>}
                {company.email && <Text>Email: {company.email}</Text>}
              </>
            )}
          </View>
          <Text style={styles.settlementTitle}>DRIVER SETTLEMENT</Text>
        </View>

        {/* Settlement Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Settlement Number:</Text>
            <Text style={styles.value}>{settlement.settlementNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Period:</Text>
            <Text style={styles.value}>
              {formatDate(settlement.periodStart)} - {formatDate(settlement.periodEnd)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{settlement.status}</Text>
          </View>
          {settlement.paidDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Paid Date:</Text>
              <Text style={styles.value}>{formatDate(settlement.paidDate)}</Text>
            </View>
          )}
        </View>

        {/* Driver Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Driver Name:</Text>
            <Text style={styles.value}>
              {driver.user.firstName} {driver.user.lastName}
            </Text>
          </View>
          {/* Driver Number hidden per request */}
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{driver.user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pay Rate:</Text>
            <Text style={styles.value}>{formatPayType(driver.payType, driver.payRate)}</Text>
          </View>
        </View>

        {/* Loads Summary */}
        {loads && loads.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loads Summary ({loads.length} loads)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { width: 60 }]}>Load #</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>Route</Text>
                <Text style={[styles.tableCellNumber, { width: 70 }]}>Miles</Text>
                <Text style={[styles.tableCellNumber, { width: 80 }]}>Revenue</Text>
                <Text style={[styles.tableCellNumber, { width: 80 }]}>Driver Pay</Text>
                <Text style={[styles.tableCellNumber, { width: 70 }]}>Delivered</Text>
              </View>
              {loads.map((load: any, index: number) => (
                <View key={load.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: 60 }]}>{load.loadNumber || 'N/A'}</Text>
                  <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}>
                    {load.pickupCity}, {load.pickupState} → {load.deliveryCity}, {load.deliveryState}
                  </Text>
                  <Text style={[styles.tableCellNumber, { width: 70 }]}>
                    {load.totalMiles || load.loadedMiles || load.emptyMiles || 0}
                  </Text>
                  <Text style={[styles.tableCellNumber, { width: 80 }]}>
                    {formatCurrency(load.revenue || 0)}
                  </Text>
                  <Text style={[styles.tableCellNumber, { width: 80 }]}>
                    {formatCurrency(load.driverPay || 0)}
                  </Text>
                  <Text style={[styles.tableCellNumber, { width: 70, fontSize: 8 }]}>
                    {load.deliveredAt ? formatDate(load.deliveredAt) : 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Miles:</Text>
              <Text style={styles.value}>{totalMiles.toLocaleString()} miles</Text>
            </View>
          </View>
        )}

        {/* Deductions */}
        {deductionItems && deductionItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
                <Text style={[styles.tableCell, { width: 100 }]}>Type</Text>
                <Text style={[styles.tableCellNumber, { width: 80 }]}>Amount</Text>
              </View>
              {deductionItems.map((deduction: any, index: number) => (
                <View key={deduction.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{deduction.description}</Text>
                  <Text style={[styles.tableCell, { width: 100 }]}>{deduction.deductionType}</Text>
                  <Text style={[styles.tableCellNumber, { width: 80 }]}>
                    {formatCurrency(deduction.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross Pay:</Text>
              <Text style={styles.totalValue}>{formatCurrency(settlement.grossPay)}</Text>
            </View>
            {settlement.deductions > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Deductions:</Text>
                <Text style={[styles.totalValue, styles.negative]}>
                  -{formatCurrency(settlement.deductions)}
                </Text>
              </View>
            )}
            {settlement.advances > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Advances:</Text>
                <Text style={[styles.totalValue, styles.negative]}>
                  -{formatCurrency(settlement.advances)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>Net Pay:</Text>
              <Text
                style={[
                  styles.grandTotalValue,
                  settlement.netPay >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {formatCurrency(settlement.netPay)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {settlement.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{settlement.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {(!company || !company.hideFooter) && (
            <Text>This settlement statement was generated on {formatDate(new Date())}</Text>
          )}
          {company && company.name && !company.hideName && (!company.hideFooter) && (
            <Text style={{ marginTop: 5 }}>
              Generated by {company.name} - All amounts are in USD
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

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

    try {
      // Generate PDF
      const pdfBuffer = await renderToBuffer(
        <SettlementPDF
          settlement={settlement}
          company={brandingCompany} // Use brandingCompany
          driver={settlement.driver}
          loads={loads}
          deductionItems={settlement.deductionItems || []}
          advances={advances}
        />
      );

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

      // Return PDF as response - use slice to get plain ArrayBuffer
      return new NextResponse(pdfArray.buffer.slice(0) as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="settlement-${settlement.settlementNumber}.pdf"`,
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

