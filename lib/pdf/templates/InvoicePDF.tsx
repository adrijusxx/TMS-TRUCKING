/**
 * Invoice PDF Template
 * 
 * Generates professional invoices with factoring support.
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
} from '../PDFFactory';

const styles = StyleSheet.create({
  ...baseStyles,
  billToBox: {
    padding: 12,
    backgroundColor: '#f8fafc',
    border: '1 solid #e2e8f0',
    marginBottom: 15,
    width: '45%',
  },
  remitToBox: {
    padding: 12,
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
    marginBottom: 15,
    width: '45%',
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  noaBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fef3c7',
    border: '2 solid #f59e0b',
  },
  noaTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  statusBadge: {
    fontSize: 8,
    padding: '3 8',
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});

export interface InvoicePDFData {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date | string;
    dueDate: Date | string;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    amountPaid: number;
    balance: number;
    notes?: string;
  };
  customer: {
    id: string;
    name: string;
    customerNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    email?: string;
    phone?: string;
  };
  company: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
    mcNumber?: string;
    dotNumber?: string;
  } | null;
  loads: Array<{
    id: string;
    loadNumber: string;
    pickupCity?: string;
    pickupState?: string;
    deliveryCity?: string;
    deliveryState?: string;
    revenue: number;
    pickupDate?: Date | string;
    deliveryDate?: Date | string;
  }>;
  remitToAddress?: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
  } | null;
  noticeOfAssignment?: string | null;
}

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return styles.statusPaid;
    case 'overdue':
      return styles.statusOverdue;
    default:
      return styles.statusPending;
  }
};

export const InvoicePDF: React.FC<InvoicePDFData> = ({
  invoice,
  customer,
  company,
  loads,
  remitToAddress,
  noticeOfAssignment,
}) => {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <CompanyHeader
          company={company}
          documentTitle="INVOICE"
          documentNumber={invoice.invoiceNumber}
        />

        {/* Invoice Details Row */}
        <View style={[baseStyles.section, { marginBottom: 10 }]}>
          <View style={baseStyles.row}>
            <View style={{ flex: 1 }}>
              <InfoRow label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
              <InfoRow label="Due Date" value={formatDate(invoice.dueDate)} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Status:</Text>
                <Text style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
                  {invoice.status.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bill To & Remit To */}
        <View style={styles.twoColumn}>
          <View style={styles.billToBox}>
            <Text style={[baseStyles.sectionTitle, { marginBottom: 6, borderBottom: 'none' }]}>
              Bill To:
            </Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{customer.name}</Text>
            {customer.customerNumber && (
              <Text style={{ fontSize: 8, color: '#666' }}>Customer #: {customer.customerNumber}</Text>
            )}
            {customer.address && <Text style={{ fontSize: 9 }}>{customer.address}</Text>}
            {(customer.city || customer.state) && (
              <Text style={{ fontSize: 9 }}>
                {customer.city}, {customer.state} {customer.zip}
              </Text>
            )}
            {customer.email && <Text style={{ fontSize: 8, color: '#666' }}>{customer.email}</Text>}
          </View>

          {remitToAddress && (
            <View style={styles.remitToBox}>
              <Text style={[baseStyles.sectionTitle, { marginBottom: 6, borderBottom: 'none', color: '#92400e' }]}>
                Remit Payment To:
              </Text>
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{remitToAddress.name}</Text>
              {remitToAddress.address && <Text style={{ fontSize: 9 }}>{remitToAddress.address}</Text>}
              {(remitToAddress.city || remitToAddress.state) && (
                <Text style={{ fontSize: 9 }}>
                  {remitToAddress.city}, {remitToAddress.state} {remitToAddress.zip}
                </Text>
              )}
              {remitToAddress.phone && <Text style={{ fontSize: 8 }}>Phone: {remitToAddress.phone}</Text>}
            </View>
          )}
        </View>

        {/* Loads Table */}
        {loads.length > 0 && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>Load Details</Text>
            <View style={baseStyles.table}>
              <View style={baseStyles.tableHeader}>
                <Text style={[baseStyles.tableCell, { width: 70 }]}>Load #</Text>
                <Text style={[baseStyles.tableCell, { flex: 2 }]}>Route</Text>
                <Text style={[baseStyles.tableCellRight, { width: 80 }]}>Pickup</Text>
                <Text style={[baseStyles.tableCellRight, { width: 80 }]}>Delivery</Text>
                <Text style={[baseStyles.tableCellRight]}>Amount</Text>
              </View>
              {loads.map((load, idx) => (
                <View
                  key={load.id}
                  style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
                >
                  <Text style={[baseStyles.tableCell, { width: 70 }]}>{load.loadNumber}</Text>
                  <Text style={[baseStyles.tableCell, { flex: 2, fontSize: 8 }]}>
                    {load.pickupCity && load.pickupState
                      ? `${load.pickupCity}, ${load.pickupState}`
                      : 'N/A'}{' '}
                    →{' '}
                    {load.deliveryCity && load.deliveryState
                      ? `${load.deliveryCity}, ${load.deliveryState}`
                      : 'N/A'}
                  </Text>
                  <Text style={[baseStyles.tableCellRight, { width: 80, fontSize: 8 }]}>
                    {load.pickupDate ? formatDate(load.pickupDate).split(',')[0] : 'N/A'}
                  </Text>
                  <Text style={[baseStyles.tableCellRight, { width: 80, fontSize: 8 }]}>
                    {load.deliveryDate ? formatDate(load.deliveryDate).split(',')[0] : 'N/A'}
                  </Text>
                  <Text style={[baseStyles.tableCellRight]}>{formatCurrency(load.revenue)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Totals */}
        <View style={baseStyles.totals}>
          <View style={baseStyles.totalRow}>
            <Text style={baseStyles.totalLabel}>Subtotal:</Text>
            <Text style={baseStyles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.tax > 0 && (
            <View style={baseStyles.totalRow}>
              <Text style={baseStyles.totalLabel}>Tax:</Text>
              <Text style={baseStyles.totalValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
          )}
          <View style={baseStyles.grandTotal}>
            <Text style={baseStyles.grandTotalLabel}>TOTAL DUE:</Text>
            <Text style={baseStyles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.amountPaid > 0 && (
            <View style={baseStyles.totalRow}>
              <Text style={baseStyles.totalLabel}>Amount Paid:</Text>
              <Text style={[baseStyles.totalValue, baseStyles.positive]}>
                -{formatCurrency(invoice.amountPaid)}
              </Text>
            </View>
          )}
          {invoice.balance > 0 && (
            <View style={[baseStyles.totalRow, { backgroundColor: '#fef2f2', marginTop: 5 }]}>
              <Text style={[baseStyles.totalLabel, baseStyles.negative]}>Balance Due:</Text>
              <Text style={[baseStyles.totalValue, baseStyles.negative]}>
                {formatCurrency(invoice.balance)}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={[baseStyles.section, { marginTop: 20 }]}>
            <Text style={baseStyles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 9 }}>{invoice.notes}</Text>
          </View>
        )}

        {/* Notice of Assignment */}
        {noticeOfAssignment && (
          <View style={styles.noaBox}>
            <Text style={styles.noaTitle}>NOTICE OF ASSIGNMENT</Text>
            <Text style={{ fontSize: 8, lineHeight: 1.4 }}>{noticeOfAssignment}</Text>
          </View>
        )}

        {/* Footer */}
        <PDFFooter
          companyName={company?.name}
          customText="Thank you for your business!"
        />
      </Page>
    </Document>
  );
};

export default InvoicePDF;





