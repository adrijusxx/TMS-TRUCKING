import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';

// Disable static generation for this route
export const dynamic = 'force-dynamic';

// Register fonts if needed (optional)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
// });

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
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 20,
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
  },
  tableCellNumber: {
    width: 80,
    textAlign: 'right',
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
});

function InvoicePDF({ invoice, company, loads, remitToAddress, noticeOfAssignment }: any) {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {company && (
              <>
                {!company.hideName && <Text style={styles.companyName}>{company.name}</Text>}
                <Text>{company.address}</Text>
                <Text>
                  {company.city}, {company.state} {company.zip}
                </Text>
                {company.phone && <Text>Phone: {company.phone}</Text>}
                {company.email && <Text>Email: {company.email}</Text>}
              </>
            )}
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Remit To Section (Factoring Company if factored) */}
        {remitToAddress && (
          <View style={styles.section}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Remit To:</Text>
            <Text>{remitToAddress.name}</Text>
            {remitToAddress.address && <Text>{remitToAddress.address}</Text>}
            {(remitToAddress.city || remitToAddress.state || remitToAddress.zip) && (
              <Text>
                {remitToAddress.city ? `${remitToAddress.city}, ` : ''}
                {remitToAddress.state} {remitToAddress.zip || ''}
              </Text>
            )}
            {remitToAddress.phone && <Text>Phone: {remitToAddress.phone}</Text>}
            {remitToAddress.email && <Text>Email: {remitToAddress.email}</Text>}
          </View>
        )}

        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Number:</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.invoiceDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>
              {invoice.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Bill To:</Text>
          <Text>{invoice.customer.name}</Text>
          {invoice.customer.customerNumber && (
            <Text>Customer #: {invoice.customer.customerNumber}</Text>
          )}
        </View>

        {/* Loads Table */}
        {loads && loads.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { width: 100 }]}>Load #</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Route</Text>
              <Text style={[styles.tableCellNumber]}>Revenue</Text>
            </View>
            {loads.map((load: any) => (
              <View key={load.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 100 }]}>{load.loadNumber}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {load.pickupCity && load.pickupState
                    ? `${load.pickupCity}, ${load.pickupState} → `
                    : ''}
                  {load.deliveryCity && load.deliveryState
                    ? `${load.deliveryCity}, ${load.deliveryState}`
                    : 'N/A'}
                </Text>
                <Text style={styles.tableCellNumber}>{formatCurrency(load.revenue || 0)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.amountPaid > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.amountPaid)}</Text>
            </View>
          )}
          {invoice.balance > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance Due:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.balance)}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes:</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Notice of Assignment (Factoring) */}
        {noticeOfAssignment && (
          <View style={[styles.section, { marginTop: 30, padding: 15, backgroundColor: '#FEF3C7', border: '1 solid #F59E0B' }]}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 12 }}>NOTICE OF ASSIGNMENT</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{noticeOfAssignment}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          {company && company.name && (
            <Text style={{ marginTop: 5 }}>
              This invoice was generated by {company.name}
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
    const invoiceId = resolvedParams.id;

    // Fetch invoice with related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        },
        { status: 404 }
      );
    }

    // Fetch company information
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });

    // Fetch loads if invoice has load IDs to derive MC Number
    const loads =
      invoice.loadIds && invoice.loadIds.length > 0
        ? await prisma.load.findMany({
          where: {
            id: { in: invoice.loadIds },
            companyId: session.user.companyId,
          },
          select: {
            id: true,
            loadNumber: true,
            pickupCity: true,
            pickupState: true,
            deliveryCity: true,
            deliveryState: true,
            revenue: true,
            mcNumberId: true, // Fetch MC Number to override branding
          },
        })
        : [];

    // Derive MC Number from loads (assume all loads on an invoice belong to same MC)
    const mcNumberId = loads.length > 0 ? loads[0].mcNumberId : null;
    let mcNumber = null;

    if (mcNumberId) {
      mcNumber = await prisma.mcNumber.findUnique({
        where: { id: mcNumberId },
      });
    }

    // Apply MC Branding Overrides
    const brandingCompany: any = { ...company };
    if (mcNumber) {
      // Parse MC specific branding JSON
      const branding = mcNumber.branding ? (typeof mcNumber.branding === 'string' ? JSON.parse(mcNumber.branding) : mcNumber.branding) : {};

      // Override text fields if present on MC
      if (mcNumber.logoUrl) brandingCompany.logoUrl = mcNumber.logoUrl;
      if (mcNumber.address) brandingCompany.address = mcNumber.address;
      if (mcNumber.city) brandingCompany.city = mcNumber.city;
      if (mcNumber.state) brandingCompany.state = mcNumber.state;
      if (mcNumber.zip) brandingCompany.zip = mcNumber.zip;
      if (mcNumber.email) brandingCompany.email = mcNumber.email;
      if (mcNumber.companyName) brandingCompany.name = mcNumber.companyName; // Override name 

      // Apply hideCompanyName preference
      if (branding.hideCompanyName) {
        brandingCompany.hideName = true;
      }
    }

    // 🔥 CRITICAL: Finalize invoice with factoring logic
    const invoiceManager = new InvoiceManager();
    const finalization = await invoiceManager.finalizeInvoice(invoiceId);

    if (!finalization.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FINALIZATION_ERROR', message: finalization.error || 'Failed to finalize invoice' },
        },
        { status: 500 }
      );
    }

    // Generate PDF with factoring information
    const pdfDoc = (
      <InvoicePDF
        invoice={invoice}
        company={brandingCompany}
        loads={loads}
        remitToAddress={finalization.remitToAddress}
        noticeOfAssignment={finalization.noticeOfAssignment}
      />
    );

    const pdfBlob = await renderToBuffer(pdfDoc);

    // Return PDF as response - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBlob), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate PDF',
        },
      },
      { status: 500 }
    );
  }
}


