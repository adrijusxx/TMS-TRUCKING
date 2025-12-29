/**
 * IFTA Report PDF Template
 * 
 * Generates quarterly IFTA fuel tax reports.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  baseStyles,
  CompanyHeader,
  InfoRow,
  PDFFooter,
  formatCurrency,
  formatDate,
  formatNumber,
} from '../PDFFactory';

const styles = StyleSheet.create({
  ...baseStyles,
  summaryBox: {
    padding: 15,
    backgroundColor: '#f0f9ff',
    border: '1 solid #0ea5e9',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  stateRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e5e5',
  },
  stateRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e5e5',
    backgroundColor: '#fafafa',
  },
  netPositive: {
    color: '#166534',
    fontWeight: 'bold',
  },
  netNegative: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  quarterBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '4 12',
    borderRadius: 4,
  },
});

export interface IFTAReportPDFData {
  report: {
    quarter: number;
    year: number;
    periodStart: Date | string;
    periodEnd: Date | string;
    totalMiles: number;
    totalGallons: number;
    mpg: number;
    stateBreakdown: Array<{
      state: string;
      stateName: string;
      miles: number;
      taxableMiles: number;
      taxRate: number;
      taxDue: number;
      taxPaid: number;
      netTax: number;
    }>;
    totalTaxDue: number;
    totalTaxPaid: number;
    netTaxDue: number;
    loadsIncluded: number;
  };
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
}

const getQuarterName = (quarter: number): string => {
  const names: Record<number, string> = {
    1: 'Q1 (Jan-Mar)',
    2: 'Q2 (Apr-Jun)',
    3: 'Q3 (Jul-Sep)',
    4: 'Q4 (Oct-Dec)',
  };
  return names[quarter] || `Q${quarter}`;
};

export const IFTAReportPDF: React.FC<IFTAReportPDFData> = ({
  report,
  company,
}) => {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <CompanyHeader
          company={company}
          documentTitle="IFTA REPORT"
          documentNumber={`Q${report.quarter}-${report.year}`}
        />

        {/* Period Info */}
        <View style={[baseStyles.row, { marginBottom: 15, alignItems: 'center', gap: 20 }]}>
          <Text style={styles.quarterBadge}>{getQuarterName(report.quarter)} {report.year}</Text>
          <Text style={{ fontSize: 9, color: '#666' }}>
            {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
          </Text>
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatNumber(report.totalMiles)}</Text>
              <Text style={styles.summaryLabel}>TOTAL MILES</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatNumber(report.totalGallons, 1)}</Text>
              <Text style={styles.summaryLabel}>TOTAL GALLONS</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{report.mpg.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>AVG MPG</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{report.loadsIncluded}</Text>
              <Text style={styles.summaryLabel}>LOADS</Text>
            </View>
          </View>
        </View>

        {/* State Breakdown Table */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>
            State-by-State Breakdown ({report.stateBreakdown.length} states)
          </Text>
          <View style={baseStyles.table}>
            <View style={baseStyles.tableHeader}>
              <Text style={[baseStyles.tableCell, { width: 40 }]}>State</Text>
              <Text style={[baseStyles.tableCell, { flex: 1.5 }]}>State Name</Text>
              <Text style={[baseStyles.tableCellRight, { width: 60 }]}>Miles</Text>
              <Text style={[baseStyles.tableCellRight, { width: 50 }]}>Rate</Text>
              <Text style={[baseStyles.tableCellRight, { width: 65 }]}>Tax Due</Text>
              <Text style={[baseStyles.tableCellRight, { width: 65 }]}>Tax Paid</Text>
              <Text style={[baseStyles.tableCellRight, { width: 65 }]}>Net Tax</Text>
            </View>
            {report.stateBreakdown.map((state, idx) => (
              <View
                key={state.state}
                style={idx % 2 === 0 ? styles.stateRow : styles.stateRowAlt}
              >
                <Text style={[baseStyles.tableCell, { width: 40, fontWeight: 'bold' }]}>
                  {state.state}
                </Text>
                <Text style={[baseStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>
                  {state.stateName}
                </Text>
                <Text style={[baseStyles.tableCellRight, { width: 60 }]}>
                  {formatNumber(state.miles, 1)}
                </Text>
                <Text style={[baseStyles.tableCellRight, { width: 50, fontSize: 8 }]}>
                  ${state.taxRate.toFixed(4)}
                </Text>
                <Text style={[baseStyles.tableCellRight, { width: 65 }]}>
                  {formatCurrency(state.taxDue)}
                </Text>
                <Text style={[baseStyles.tableCellRight, { width: 65 }]}>
                  {formatCurrency(state.taxPaid)}
                </Text>
                <Text
                  style={[
                    baseStyles.tableCellRight,
                    { width: 65 },
                    state.netTax >= 0 ? styles.netNegative : styles.netPositive,
                  ]}
                >
                  {formatCurrency(state.netTax)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={baseStyles.totals}>
          <View style={baseStyles.totalRow}>
            <Text style={baseStyles.totalLabel}>Total Tax Due:</Text>
            <Text style={baseStyles.totalValue}>{formatCurrency(report.totalTaxDue)}</Text>
          </View>
          <View style={baseStyles.totalRow}>
            <Text style={baseStyles.totalLabel}>Total Tax Paid:</Text>
            <Text style={[baseStyles.totalValue, baseStyles.positive]}>
              -{formatCurrency(report.totalTaxPaid)}
            </Text>
          </View>
          <View style={baseStyles.grandTotal}>
            <Text style={baseStyles.grandTotalLabel}>
              {report.netTaxDue >= 0 ? 'NET TAX OWED:' : 'NET CREDIT:'}
            </Text>
            <Text style={baseStyles.grandTotalValue}>
              {formatCurrency(Math.abs(report.netTaxDue))}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={[baseStyles.section, { marginTop: 25 }]}>
          <Text style={{ fontSize: 8, color: '#666' }}>
            * Tax rates are based on current IFTA fuel tax rates. Actual rates may vary.
            Please verify with your state's IFTA authority before filing.
          </Text>
          <Text style={{ fontSize: 8, color: '#666', marginTop: 5 }}>
            * Fuel purchases should be documented with receipts for tax credit claims.
          </Text>
        </View>

        {/* Footer */}
        <PDFFooter
          companyName={company?.name}
          customText="This report is for informational purposes. Verify with official IFTA filings."
        />
      </Page>
    </Document>
  );
};

export default IFTAReportPDF;





