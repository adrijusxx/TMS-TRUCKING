import React from 'react';
import { Page, Text, View, StyleSheet, Document } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '2 solid #000', paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, borderBottom: '1 solid #E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 120, fontWeight: 'bold', color: '#374151' },
  value: { flex: 1, color: '#111827' },
  table: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderColor: '#D1D5DB', paddingVertical: 5, paddingHorizontal: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingVertical: 4, paddingHorizontal: 4 },
  cell: { fontSize: 8 },
  cellRight: { fontSize: 8, textAlign: 'right' },
  cellHeader: { fontSize: 8, fontWeight: 'bold' },
  cellHeaderRight: { fontSize: 8, fontWeight: 'bold', textAlign: 'right' },
  totalsRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingVertical: 5, paddingHorizontal: 4, borderTopWidth: 2, borderColor: '#9CA3AF' },
  summaryCard: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  card: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, padding: 10 },
  cardLabel: { fontSize: 9, color: '#6B7280', marginBottom: 2 },
  cardValue: { fontSize: 14, fontWeight: 'bold' },
});

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d: Date | string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

interface SalaryBatchPDFProps {
  batch: any;
  company: any;
}

export function SalaryBatchPDF({ batch, company }: SalaryBatchPDFProps) {
  const settlements = batch.settlements || [];
  const totals = settlements.reduce((acc: any, s: any) => ({
    grossPay: acc.grossPay + (s.grossPay || 0),
    advances: acc.advances + (s.advances || 0),
    deductions: acc.deductions + (s.deductions || 0),
    netPay: acc.netPay + (s.netPay || 0),
    trips: acc.trips + (s.loadIds?.length || 0),
  }), { grossPay: 0, advances: 0, deductions: 0, netPay: 0, trips: 0 });

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{company?.name || 'Company'}</Text>
          <Text style={styles.subtitle}>Salary Batch: {batch.batchNumber} — Status: {batch.status}</Text>
          <Text style={styles.subtitle}>
            Period: {fmtDate(batch.periodStart)} – {fmtDate(batch.periodEnd)}
            {batch.checkDate ? ` | Check Date: ${fmtDate(batch.checkDate)}` : ''}
          </Text>
          {company?.address && (
            <Text style={{ fontSize: 9, color: '#9CA3AF' }}>
              {company.address}, {company.city}, {company.state} {company.zip}
            </Text>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCard}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Settlements</Text>
            <Text style={styles.cardValue}>{settlements.length}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Trips</Text>
            <Text style={styles.cardValue}>{totals.trips}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Gross Pay</Text>
            <Text style={styles.cardValue}>{fmt(totals.grossPay)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Advances</Text>
            <Text style={styles.cardValue}>{fmt(totals.advances)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Deductions</Text>
            <Text style={styles.cardValue}>{fmt(totals.deductions)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Net Pay</Text>
            <Text style={[styles.cardValue, { color: '#059669' }]}>{fmt(totals.netPay)}</Text>
          </View>
        </View>

        {/* Settlements Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlements Detail</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.cellHeader, { width: 65 }]}>Settlement #</Text>
              <Text style={[styles.cellHeader, { width: 55 }]}>Type</Text>
              <Text style={[styles.cellHeader, { width: 50 }]}>Truck</Text>
              <Text style={[styles.cellHeader, { flex: 1.5 }]}>Payee</Text>
              <Text style={[styles.cellHeader, { width: 45 }]}>Status</Text>
              <Text style={[styles.cellHeaderRight, { width: 30 }]}>Trips</Text>
              <Text style={[styles.cellHeader, { width: 60 }]}>Pickup</Text>
              <Text style={[styles.cellHeader, { width: 60 }]}>Delivery</Text>
              <Text style={[styles.cellHeaderRight, { width: 65 }]}>Gross Pay</Text>
              <Text style={[styles.cellHeaderRight, { width: 60 }]}>Advances</Text>
              <Text style={[styles.cellHeaderRight, { width: 60 }]}>Deductions</Text>
              <Text style={[styles.cellHeaderRight, { width: 65 }]}>Net Pay</Text>
            </View>
            {settlements.map((s: any, i: number) => {
              const driverName = s.driver?.user ? `${s.driver.user.firstName} ${s.driver.user.lastName}` : '-';
              const driverType = s.driver?.driverType === 'COMPANY_DRIVER' ? 'Company' :
                s.driver?.driverType === 'OWNER_OPERATOR' ? 'O/O' : s.driver?.driverType || '-';
              return (
                <View key={s.id || i} style={styles.tableRow}>
                  <Text style={[styles.cell, { width: 65 }]}>{s.settlementNumber}</Text>
                  <Text style={[styles.cell, { width: 55 }]}>{driverType}</Text>
                  <Text style={[styles.cell, { width: 50 }]}>{s.driver?.currentTruck?.truckNumber || '-'}</Text>
                  <Text style={[styles.cell, { flex: 1.5 }]}>{driverName}</Text>
                  <Text style={[styles.cell, { width: 45 }]}>{s.status}</Text>
                  <Text style={[styles.cellRight, { width: 30 }]}>{s.loadIds?.length || 0}</Text>
                  <Text style={[styles.cell, { width: 60, fontSize: 7 }]}>{fmtDate(s.pickupDate)}</Text>
                  <Text style={[styles.cell, { width: 60, fontSize: 7 }]}>{fmtDate(s.deliveryDate)}</Text>
                  <Text style={[styles.cellRight, { width: 65 }]}>{fmt(s.grossPay || 0)}</Text>
                  <Text style={[styles.cellRight, { width: 60 }]}>{fmt(s.advances || 0)}</Text>
                  <Text style={[styles.cellRight, { width: 60 }]}>{fmt(s.deductions || 0)}</Text>
                  <Text style={[styles.cellRight, { width: 65, fontWeight: 'bold' }]}>{fmt(s.netPay || 0)}</Text>
                </View>
              );
            })}
            {/* Totals */}
            <View style={styles.totalsRow}>
              <Text style={[styles.cellHeader, { width: 65 }]}>TOTALS</Text>
              <Text style={[styles.cell, { width: 55 }]} />
              <Text style={[styles.cell, { width: 50 }]} />
              <Text style={[styles.cellHeader, { flex: 1.5 }]}>{settlements.length} settlements</Text>
              <Text style={[styles.cell, { width: 45 }]} />
              <Text style={[styles.cellHeaderRight, { width: 30 }]}>{totals.trips}</Text>
              <Text style={[styles.cell, { width: 60 }]} />
              <Text style={[styles.cell, { width: 60 }]} />
              <Text style={[styles.cellHeaderRight, { width: 65 }]}>{fmt(totals.grossPay)}</Text>
              <Text style={[styles.cellHeaderRight, { width: 60 }]}>{fmt(totals.advances)}</Text>
              <Text style={[styles.cellHeaderRight, { width: 60 }]}>{fmt(totals.deductions)}</Text>
              <Text style={[styles.cellHeaderRight, { width: 65 }]}>{fmt(totals.netPay)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {batch.notes && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{batch.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Generated on {new Date().toLocaleDateString('en-US')}</Text>
          <Text style={{ fontSize: 8, color: '#9CA3AF' }}>{company?.name || ''}</Text>
        </View>
      </Page>
    </Document>
  );
}
