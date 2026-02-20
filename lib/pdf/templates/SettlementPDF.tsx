/**
 * Settlement PDF Template
 * 
 * Generates professional driver settlement statements.
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

// Extended styles for settlements
const styles = StyleSheet.create({
  ...baseStyles,
  driverBox: {
    padding: 12,
    backgroundColor: '#f8fafc',
    border: '1 solid #e2e8f0',
    marginBottom: 15,
  },
  payTypeTag: {
    fontSize: 8,
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '2 6',
    borderRadius: 2,
  },
  loadRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1 solid #f1f5f9',
    fontSize: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 15,
  },
  summaryColumn: {
    flex: 1,
  },
});

export interface SettlementPDFData {
  settlement: {
    id: string;
    settlementNumber: string;
    periodStart: Date | string;
    periodEnd: Date | string;
    status: string;
    grossPay: number;
    deductions: number;
    advances: number;
    netPay: number;
    notes?: string;
    paidDate?: Date | string | null;
  };
  company: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
  } | null;
  driver: {
    driverNumber: string;
    payType: string;
    payRate: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  loads: Array<{
    id: string;
    loadNumber: string;
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
    revenue: number;
    driverPay: number;
    totalMiles?: number;
    deliveredAt?: Date | string | null;
  }>;
  deductionItems: Array<{
    id: string;
    description: string;
    deductionType: string;
    amount: number;
  }>;
  advances: Array<{
    id: string;
    amount: number;
    requestDate: Date | string;
  }>;
}

const formatPayType = (payType: string, payRate: number): string => {
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

export const SettlementPDF: React.FC<SettlementPDFData> = ({
  settlement,
  company,
  driver,
  loads,
  deductionItems,
  advances,
}) => {
  const totalMiles = loads.reduce(
    (sum, load) => sum + (load.totalMiles || 0),
    0
  );
  const totalRevenue = loads.reduce(
    (sum, load) => sum + (load.revenue || 0),
    0
  );

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <CompanyHeader
          company={company}
          documentTitle="SETTLEMENT"
          documentNumber={settlement.settlementNumber}
        />

        {/* Settlement Info Row */}
        <View style={[baseStyles.row, { marginBottom: 15, gap: 30 }]}>
          <View style={{ flex: 1 }}>
            <InfoRow label="Period" value={`${formatDate(settlement.periodStart)} - ${formatDate(settlement.periodEnd)}`} />
            <InfoRow label="Status" value={settlement.status.replace(/_/g, ' ')} />
            {settlement.paidDate && (
              <InfoRow label="Paid Date" value={formatDate(settlement.paidDate)} />
            )}
          </View>
        </View>

        {/* Driver Information */}
        <View style={styles.driverBox}>
          <Text style={[baseStyles.sectionTitle, { marginBottom: 8, borderBottom: 'none' }]}>
            Driver Information
          </Text>
          <View style={baseStyles.row}>
            <View style={{ flex: 1 }}>
              <InfoRow label="Driver Name" value={`${driver.user.firstName} ${driver.user.lastName}`} />
              <InfoRow label="Driver Number" value={driver.driverNumber} />
            </View>
            <View style={{ flex: 1 }}>
              <InfoRow label="Email" value={driver.user.email} />
              <InfoRow label="Pay Rate" value={formatPayType(driver.payType, driver.payRate)} />
            </View>
          </View>
        </View>

        {/* Loads Table */}
        {loads.length > 0 && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>
              Loads ({loads.length}) - Total Miles: {formatNumber(totalMiles)}
            </Text>
            <View style={baseStyles.table}>
              <View style={baseStyles.tableHeader}>
                <Text style={[baseStyles.tableCell, { width: 55 }]}>Load #</Text>
                <Text style={[baseStyles.tableCell, { flex: 2 }]}>Route</Text>
                <Text style={[baseStyles.tableCellRight, { width: 55 }]}>Miles</Text>
                <Text style={[baseStyles.tableCellRight, { width: 70 }]}>Revenue</Text>
                <Text style={[baseStyles.tableCellRight, { width: 70 }]}>Pay</Text>
                <Text style={[baseStyles.tableCellRight, { width: 60 }]}>Date</Text>
              </View>
              {loads.map((load, idx) => (
                <View
                  key={load.id}
                  style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
                >
                  <Text style={[baseStyles.tableCell, { width: 55 }]}>{load.loadNumber}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 2, fontSize: 8 }]}>
                    {load.pickupCity}, {load.pickupState} → {load.deliveryCity}, {load.deliveryState}
                  </Text>
                  <Text style={[baseStyles.tableCellRight, { width: 55 }]}>
                    {formatNumber(load.totalMiles || 0)}
                  </Text>
                  <Text style={[baseStyles.tableCellRight, { width: 70 }]}>
                    {formatCurrency(load.revenue)}
                  </Text>
                  <Text style={[baseStyles.tableCellRight, { width: 70 }]}>
                    {formatCurrency(load.driverPay)}
                  </Text>
                  <Text style={[baseStyles.tableCellRight, { width: 60, fontSize: 7 }]}>
                    {load.deliveredAt ? formatDate(load.deliveredAt).split(',')[0] : 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Deductions */}
        {deductionItems.length > 0 && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>Deductions</Text>
            <View style={baseStyles.table}>
              <View style={baseStyles.tableHeader}>
                <Text style={[baseStyles.tableCell, { flex: 2 }]}>Description</Text>
                <Text style={[baseStyles.tableCell, { width: 100 }]}>Type</Text>
                <Text style={[baseStyles.tableCellRight]}>Amount</Text>
              </View>
              {deductionItems.map((item, idx) => (
                <View
                  key={item.id}
                  style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
                >
                  <Text style={[baseStyles.tableCell, { flex: 2 }]}>{item.description}</Text>
                  <Text style={[baseStyles.tableCell, { width: 100 }]}>{item.deductionType}</Text>
                  <Text style={[baseStyles.tableCellRight, baseStyles.negative]}>
                    -{formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Financial Summary */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Financial Summary</Text>
          <View style={baseStyles.totals}>
            <View style={baseStyles.totalRow}>
              <Text style={baseStyles.totalLabel}>Gross Pay:</Text>
              <Text style={baseStyles.totalValue}>{formatCurrency(settlement.grossPay)}</Text>
            </View>
            {settlement.deductions > 0 && (
              <View style={baseStyles.totalRow}>
                <Text style={baseStyles.totalLabel}>Total Deductions:</Text>
                <Text style={[baseStyles.totalValue, baseStyles.negative]}>
                  -{formatCurrency(settlement.deductions)}
                </Text>
              </View>
            )}
            {settlement.advances > 0 && (
              <View style={baseStyles.totalRow}>
                <Text style={baseStyles.totalLabel}>Advances:</Text>
                <Text style={[baseStyles.totalValue, baseStyles.negative]}>
                  -{formatCurrency(settlement.advances)}
                </Text>
              </View>
            )}
            <View style={baseStyles.grandTotal}>
              <Text style={baseStyles.grandTotalLabel}>NET PAY:</Text>
              <Text style={baseStyles.grandTotalValue}>
                {formatCurrency(settlement.netPay)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {settlement.notes && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 9, color: '#4a4a4a' }}>{settlement.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <PDFFooter companyName={company?.name} />
      </Page>
    </Document>
  );
};

export default SettlementPDF;





