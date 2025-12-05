/**
 * PDF Factory
 * 
 * Base factory for generating PDF documents with shared styles and utilities.
 * Uses @react-pdf/renderer for client-side and server-side PDF generation.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 5
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

// ============================================================================
// SHARED STYLES
// ============================================================================

export const baseStyles = StyleSheet.create({
  // Page
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  
  // Header
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #1a1a1a',
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  companyInfo: {
    maxWidth: '60%',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  companyAddress: {
    fontSize: 9,
    color: '#4a4a4a',
    marginBottom: 2,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#1a1a1a',
  },
  documentNumber: {
    fontSize: 10,
    textAlign: 'right',
    color: '#666666',
    marginTop: 4,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    borderBottom: '1 solid #e0e0e0',
    paddingBottom: 4,
  },

  // Rows
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 130,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#4a4a4a',
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: '#1a1a1a',
  },

  // Tables
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottom: '1 solid #1a1a1a',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e5e5',
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e5e5',
    fontSize: 9,
    backgroundColor: '#fafafa',
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    width: 80,
    textAlign: 'right',
  },
  tableCellSmall: {
    width: 60,
    fontSize: 8,
  },

  // Totals
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 220,
    marginBottom: 4,
    padding: 4,
  },
  totalLabel: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 10,
  },
  totalValue: {
    width: 90,
    textAlign: 'right',
    fontSize: 10,
  },
  grandTotal: {
    flexDirection: 'row',
    width: 220,
    marginTop: 8,
    padding: 10,
    backgroundColor: '#1a1a1a',
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  grandTotalValue: {
    width: 90,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Colors
  negative: {
    color: '#dc2626',
  },
  positive: {
    color: '#16a34a',
  },
  warning: {
    color: '#d97706',
  },
  muted: {
    color: '#6b7280',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 15,
    borderTop: '1 solid #e5e5e5',
    fontSize: 8,
    color: '#9ca3af',
  },

  // Boxes
  infoBox: {
    padding: 12,
    backgroundColor: '#f0f9ff',
    border: '1 solid #0ea5e9',
    marginBottom: 15,
  },
  warningBox: {
    padding: 12,
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
    marginBottom: 15,
  },
  successBox: {
    padding: 12,
    backgroundColor: '#dcfce7',
    border: '1 solid #22c55e',
    marginBottom: 15,
  },
});

// ============================================================================
// UTILITIES
// ============================================================================

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatShortDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatNumber = (num: number | null | undefined, decimals = 0): string => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

interface CompanyHeaderProps {
  company: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    mcNumber?: string;
    dotNumber?: string;
  } | null;
  documentTitle: string;
  documentNumber?: string;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  company,
  documentTitle,
  documentNumber,
}) => (
  <View style={baseStyles.header}>
    <View style={baseStyles.headerRow}>
      <View style={baseStyles.companyInfo}>
        {company && (
          <>
            <Text style={baseStyles.companyName}>{company.name || 'Company Name'}</Text>
            {company.address && (
              <Text style={baseStyles.companyAddress}>{company.address}</Text>
            )}
            {(company.city || company.state) && (
              <Text style={baseStyles.companyAddress}>
                {company.city}, {company.state} {company.zipCode}
              </Text>
            )}
            {company.phone && (
              <Text style={baseStyles.companyAddress}>Phone: {company.phone}</Text>
            )}
            {company.email && (
              <Text style={baseStyles.companyAddress}>Email: {company.email}</Text>
            )}
            {(company.mcNumber || company.dotNumber) && (
              <Text style={baseStyles.companyAddress}>
                {company.mcNumber && `MC# ${company.mcNumber}`}
                {company.mcNumber && company.dotNumber && ' | '}
                {company.dotNumber && `DOT# ${company.dotNumber}`}
              </Text>
            )}
          </>
        )}
      </View>
      <View>
        <Text style={baseStyles.documentTitle}>{documentTitle}</Text>
        {documentNumber && (
          <Text style={baseStyles.documentNumber}>#{documentNumber}</Text>
        )}
      </View>
    </View>
  </View>
);

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={baseStyles.row}>
    <Text style={baseStyles.label}>{label}:</Text>
    <Text style={baseStyles.value}>{value ?? 'N/A'}</Text>
  </View>
);

interface FooterProps {
  companyName?: string;
  customText?: string;
}

export const PDFFooter: React.FC<FooterProps> = ({ companyName, customText }) => (
  <View style={baseStyles.footer}>
    <Text>Generated on {formatDate(new Date())}</Text>
    {companyName && (
      <Text style={{ marginTop: 2 }}>
        {companyName} - All amounts in USD
      </Text>
    )}
    {customText && (
      <Text style={{ marginTop: 2 }}>{customText}</Text>
    )}
  </View>
);

// ============================================================================
// PDF FACTORY CLASS
// ============================================================================

export type PDFDocumentType = 'settlement' | 'invoice' | 'rate-con' | 'ifta-report' | 'bol';

export interface PDFGenerationResult {
  buffer: Buffer | Uint8Array;
  filename: string;
  contentType: string;
}

export class PDFFactory {
  /**
   * Generate PDF buffer from React component
   */
  static async generate(
    component: React.ReactElement
  ): Promise<Buffer | Uint8Array> {
    const buffer = await renderToBuffer(component as any);
    return buffer;
  }

  /**
   * Generate PDF with metadata
   */
  static async generateWithMetadata(
    component: React.ReactElement,
    filename: string
  ): Promise<PDFGenerationResult> {
    const buffer = await this.generate(component);
    return {
      buffer,
      filename,
      contentType: 'application/pdf',
    };
  }

  /**
   * Create NextResponse for PDF download
   */
  static createResponse(
    buffer: Buffer | Uint8Array,
    filename: string
  ): Response {
    const uint8Array = buffer instanceof Buffer
      ? new Uint8Array(buffer)
      : buffer;

    return new Response(uint8Array as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8Array.length.toString(),
      },
    });
  }
}

export default PDFFactory;



