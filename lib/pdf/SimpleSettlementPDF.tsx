import React from 'react';
import { Page, Text, View, StyleSheet, Image, Document } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontSize: 12,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '1 solid #E5E7EB',
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 50,
        objectFit: 'contain',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    period: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
    },
    // Big Summary Cards
    summaryCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        gap: 10,
    },
    card: {
        flex: 1,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    cardAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    netPayCard: {
        backgroundColor: '#ECFDF5', // Light Green
        border: '1 solid #10B981',
    },
    netPayAmount: {
        fontSize: 24,
        fontWeight: 'black', // Extra Bold
        color: '#059669',
    },

    // Sections
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#374151',
        borderBottom: '1 solid #E5E7EB',
        paddingBottom: 5,
    },

    // Simple List Rows
    simpleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottom: '1 solid #F3F4F6',
    },
    rowLabel: {
        fontSize: 11,
        color: '#4B5563',
        flex: 1,
    },
    rowAmount: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#111827',
    },

    // Trip Row Specifics
    tripRow: {
        marginBottom: 8,
        padding: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 6,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    tripRoute: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    tripDate: {
        fontSize: 10,
        color: '#6B7280',
    },
    tripDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    tripPay: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#059669',
    },

    negative: { color: '#DC2626' },
    positive: { color: '#059669' },
});

interface SimplePDFProps {
    settlement: any;
    company: any;
    driver: any;
    loads: any[];
    deductionItems: any[];
    advances: any[];
}

export function SimpleSettlementPDF({ settlement, company, driver, loads, deductionItems, advances }: SimplePDFProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Simple Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Weekly Settlement</Text>
                        <Text style={styles.period}>
                            {formatDate(settlement.periodStart)} - {formatDate(settlement.periodEnd)}
                        </Text>
                        <Text style={styles.period}>Driver: {driver.user.firstName} {driver.user.lastName}</Text>
                    </View>
                    {company && company.logoUrl && (
                        <Image style={styles.logo} src={company.logoUrl} />
                    )}
                </View>

                <View style={styles.summaryCards}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Gross Pay</Text>
                        <Text style={[styles.cardAmount, { color: '#4B5563' }]}>{formatCurrency(settlement.grossPay)}</Text>
                    </View>

                    {/* Calculate Additions separately */}
                    {(() => {
                        const additions = deductionItems.filter((d: any) => d.category === 'addition').reduce((sum: number, d: any) => sum + d.amount, 0);
                        const deductions = deductionItems.filter((d: any) => d.category !== 'addition').reduce((sum: number, d: any) => sum + d.amount, 0) +
                            advances.reduce((sum: number, a: any) => sum + a.amount, 0);

                        return (
                            <>
                                {additions > 0 && (
                                    <View style={[styles.card, { backgroundColor: '#F0FDF4' }]}>
                                        <Text style={[styles.cardTitle, { color: '#16A34A' }]}>Additions</Text>
                                        <Text style={[styles.cardAmount, styles.positive]}>+{formatCurrency(additions)}</Text>
                                    </View>
                                )}

                                <View style={styles.card}>
                                    <Text style={styles.cardTitle}>Deductions</Text>
                                    <Text style={[styles.cardAmount, styles.negative]}>
                                        -{formatCurrency(deductions)}
                                    </Text>
                                </View>
                            </>
                        );
                    })()}

                    <View style={[styles.card, styles.netPayCard]}>
                        <Text style={[styles.cardTitle, { color: '#059669' }]}>TAKE HOME</Text>
                        <Text style={styles.netPayAmount}>{formatCurrency(settlement.netPay)}</Text>
                    </View>
                </View>

                {/* Your Trips */}
                {loads && loads.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Your Trips ({loads.length})</Text>
                        {loads.map((load: any, idx: number) => (
                            <View key={idx} style={styles.tripRow}>
                                <View style={styles.tripHeader}>
                                    <Text style={styles.tripRoute}>
                                        {load.pickupCity}, {load.pickupState} → {load.deliveryCity}, {load.deliveryState}
                                    </Text>
                                    <Text style={styles.tripDate}>{load.deliveredAt ? formatDate(load.deliveredAt) : 'Pending'}</Text>
                                </View>
                                <View style={styles.tripDetails}>
                                    <Text style={{ fontSize: 10, color: '#6B7280' }}>Load #{load.loadNumber}</Text>
                                    <Text style={styles.tripPay}>{formatCurrency(load.driverPay)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Miles Summary */}
                {loads && loads.length > 0 && (
                    (() => {
                        const totalMiles = loads.reduce((sum: number, load: any) => sum + (load.totalMiles || load.loadedMiles || load.emptyMiles || 0), 0);
                        const loadedMiles = loads.reduce((sum: number, load: any) => sum + (load.loadedMiles || 0), 0);
                        const emptyMiles = loads.reduce((sum: number, load: any) => sum + (load.emptyMiles || 0), 0);

                        return (
                            <View style={[styles.section, { flexDirection: 'row', gap: 15, justifyContent: 'flex-end', marginTop: -10 }]}>
                                <Text style={{ fontSize: 10, color: '#6B7280' }}>Total Miles: <Text style={{ fontWeight: 'bold', color: '#374151' }}>{totalMiles.toLocaleString()}</Text></Text>
                                <Text style={{ fontSize: 10, color: '#6B7280' }}>Loaded: <Text style={{ fontWeight: 'bold', color: '#374151' }}>{loadedMiles.toLocaleString()}</Text></Text>
                                <Text style={{ fontSize: 10, color: '#6B7280' }}>Empty: <Text style={{ fontWeight: 'bold', color: '#374151' }}>{emptyMiles.toLocaleString()}</Text></Text>
                            </View>
                        );
                    })()
                )}

                {/* Deductions & Additions List */}
                {(deductionItems.length > 0 || advances.length > 0) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Deductions & Advances</Text>

                        {/* Advances */}
                        {advances.map((adv: any, idx: number) => (
                            <View key={`adv-${idx}`} style={styles.simpleRow}>
                                <Text style={styles.rowLabel}>Cash Advance ({formatDate(adv.requestDate)})</Text>
                                <Text style={[styles.rowAmount, styles.negative]}>-{formatCurrency(adv.amount)}</Text>
                            </View>
                        ))}

                        {/* Additions (Positive) */}
                        {deductionItems.filter((d: any) => d.category === 'addition').map((add: any, idx: number) => (
                            <View key={`add-${idx}`} style={styles.simpleRow}>
                                <Text style={styles.rowLabel}>{(add.description || add.deductionType).replace(/^Driver .*? - /, '')}</Text>
                                <Text style={[styles.rowAmount, styles.positive]}>
                                    +{formatCurrency(add.amount)}
                                </Text>
                            </View>
                        ))}

                        {/* Deductions (Negative) */}
                        {deductionItems.filter((d: any) => d.category !== 'addition').map((ded: any, idx: number) => (
                            <View key={`ded-${idx}`} style={styles.simpleRow}>
                                <Text style={styles.rowLabel}>{(ded.description || ded.deductionType).replace(/^Driver .*? - /, '')}</Text>
                                <Text style={[styles.rowAmount, styles.negative]}>
                                    -{formatCurrency(ded.amount)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 20 }}>
                    Questions? Message Dispatch.
                </Text>

            </Page>
        </Document>
    );
}
