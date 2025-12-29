/**
 * Rate Confirmation PDF Template
 * 
 * Generates rate confirmation documents for loads.
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
  locationBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8fafc',
    border: '1 solid #e2e8f0',
  },
  locationTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  pickupBox: {
    borderLeft: '3 solid #22c55e',
  },
  deliveryBox: {
    borderLeft: '3 solid #ef4444',
  },
  stopBox: {
    borderLeft: '3 solid #f59e0b',
  },
  equipmentBadge: {
    fontSize: 8,
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    padding: '2 8',
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  rateBox: {
    padding: 15,
    backgroundColor: '#ecfdf5',
    border: '2 solid #22c55e',
    marginTop: 15,
  },
  specialInstructions: {
    padding: 12,
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
    marginTop: 15,
  },
  signatureLine: {
    marginTop: 30,
    borderTop: '1 solid #1a1a1a',
    paddingTop: 5,
    width: 200,
  },
});

export interface RateConPDFData {
  load: {
    loadNumber: string;
    referenceNumber?: string;
    pickupDate: Date | string;
    deliveryDate: Date | string;
    pickupAddress?: string;
    pickupCity: string;
    pickupState: string;
    pickupZip?: string;
    deliveryAddress?: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryZip?: string;
    commodity?: string;
    weight?: number;
    totalMiles?: number;
    revenue: number;
    equipmentType?: string;
    specialInstructions?: string;
  };
  stops?: Array<{
    sequence: number;
    type: string;
    address?: string;
    city: string;
    state: string;
    zipCode?: string;
    scheduledDate?: Date | string;
  }>;
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
  customer?: {
    name: string;
    customerNumber?: string;
    phone?: string;
    email?: string;
  } | null;
  driver?: {
    name: string;
    phone?: string;
  } | null;
  truck?: {
    truckNumber: string;
  } | null;
}

export const RateConPDF: React.FC<RateConPDFData> = ({
  load,
  stops,
  company,
  customer,
  driver,
  truck,
}) => {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <CompanyHeader
          company={company}
          documentTitle="RATE CONFIRMATION"
          documentNumber={load.loadNumber}
        />

        {/* Load Info */}
        <View style={baseStyles.section}>
          <View style={[baseStyles.row, { gap: 30 }]}>
            <View style={{ flex: 1 }}>
              <InfoRow label="Load Number" value={load.loadNumber} />
              {load.referenceNumber && (
                <InfoRow label="Reference #" value={load.referenceNumber} />
              )}
              {customer && <InfoRow label="Customer" value={customer.name} />}
            </View>
            <View style={{ flex: 1 }}>
              <InfoRow label="Pickup Date" value={formatDate(load.pickupDate)} />
              <InfoRow label="Delivery Date" value={formatDate(load.deliveryDate)} />
              {load.equipmentType && (
                <View style={baseStyles.row}>
                  <Text style={baseStyles.label}>Equipment:</Text>
                  <Text style={styles.equipmentBadge}>{load.equipmentType}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Pickup & Delivery */}
        <View style={[baseStyles.row, { gap: 15, marginBottom: 15 }]}>
          {/* Pickup */}
          <View style={[styles.locationBox, styles.pickupBox]}>
            <Text style={styles.locationTitle}>📍 PICKUP</Text>
            {load.pickupAddress && <Text style={{ fontSize: 9 }}>{load.pickupAddress}</Text>}
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
              {load.pickupCity}, {load.pickupState} {load.pickupZip || ''}
            </Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 4 }}>
              Date: {formatDate(load.pickupDate)}
            </Text>
          </View>

          {/* Delivery */}
          <View style={[styles.locationBox, styles.deliveryBox]}>
            <Text style={styles.locationTitle}>🏁 DELIVERY</Text>
            {load.deliveryAddress && <Text style={{ fontSize: 9 }}>{load.deliveryAddress}</Text>}
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
              {load.deliveryCity}, {load.deliveryState} {load.deliveryZip || ''}
            </Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 4 }}>
              Date: {formatDate(load.deliveryDate)}
            </Text>
          </View>
        </View>

        {/* Stops */}
        {stops && stops.length > 0 && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>Additional Stops</Text>
            {stops.map((stop) => (
              <View key={stop.sequence} style={[styles.locationBox, styles.stopBox, { marginBottom: 8 }]}>
                <Text style={styles.locationTitle}>
                  Stop #{stop.sequence} ({stop.type})
                </Text>
                {stop.address && <Text style={{ fontSize: 9 }}>{stop.address}</Text>}
                <Text style={{ fontSize: 10 }}>
                  {stop.city}, {stop.state} {stop.zipCode || ''}
                </Text>
                {stop.scheduledDate && (
                  <Text style={{ fontSize: 8, color: '#666', marginTop: 4 }}>
                    Scheduled: {formatDate(stop.scheduledDate)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Load Details */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Load Details</Text>
          <View style={[baseStyles.row, { gap: 30 }]}>
            <View style={{ flex: 1 }}>
              {load.commodity && <InfoRow label="Commodity" value={load.commodity} />}
              {load.weight && <InfoRow label="Weight" value={`${formatNumber(load.weight)} lbs`} />}
            </View>
            <View style={{ flex: 1 }}>
              {load.totalMiles && <InfoRow label="Total Miles" value={formatNumber(load.totalMiles)} />}
              {load.equipmentType && <InfoRow label="Equipment" value={load.equipmentType} />}
            </View>
          </View>
        </View>

        {/* Rate */}
        <View style={styles.rateBox}>
          <View style={[baseStyles.row, { justifyContent: 'space-between' }]}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>AGREED RATE:</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#166534' }}>
              {formatCurrency(load.revenue)}
            </Text>
          </View>
          {load.totalMiles && load.totalMiles > 0 && (
            <Text style={{ fontSize: 9, color: '#666', marginTop: 4 }}>
              Rate per mile: {formatCurrency(load.revenue / load.totalMiles)}
            </Text>
          )}
        </View>

        {/* Special Instructions */}
        {load.specialInstructions && (
          <View style={styles.specialInstructions}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6 }}>
              ⚠️ Special Instructions
            </Text>
            <Text style={{ fontSize: 9 }}>{load.specialInstructions}</Text>
          </View>
        )}

        {/* Driver & Truck Assignment */}
        {(driver || truck) && (
          <View style={[baseStyles.section, { marginTop: 20 }]}>
            <Text style={baseStyles.sectionTitle}>Assignment</Text>
            <View style={baseStyles.row}>
              {driver && <InfoRow label="Driver" value={driver.name} />}
              {truck && <InfoRow label="Truck" value={`#${truck.truckNumber}`} />}
            </View>
            {driver?.phone && <InfoRow label="Driver Phone" value={driver.phone} />}
          </View>
        )}

        {/* Signature */}
        <View style={{ marginTop: 30 }}>
          <View style={styles.signatureLine}>
            <Text style={{ fontSize: 8 }}>Carrier Signature</Text>
          </View>
          <Text style={{ fontSize: 8, marginTop: 5 }}>Date: _______________</Text>
        </View>

        {/* Footer */}
        <PDFFooter companyName={company?.name} />
      </Page>
    </Document>
  );
};

export default RateConPDF;





