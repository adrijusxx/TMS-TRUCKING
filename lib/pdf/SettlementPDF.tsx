import React from 'react';
import { Page, Text, View, StyleSheet, Image, Document } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 35,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '2 solid #1F2937',
        paddingBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 3,
    },
    companyDetail: {
        fontSize: 8,
        color: '#6B7280',
        marginBottom: 1,
    },
    logo: {
        width: 100,
        height: 50,
        objectFit: 'contain',
    },
    settlementTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#111827',
    },
    settlementNumber: {
        fontSize: 10,
        textAlign: 'right',
        color: '#6B7280',
        marginTop: 2,
    },
    // Info grid (settlement + driver side by side)
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 20,
    },
    infoBox: {
        flex: 1,
        padding: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
    },
    infoBoxTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    infoLabel: {
        width: 70,
        fontSize: 8,
        color: '#6B7280',
    },
    infoValue: {
        flex: 1,
        fontSize: 9,
        color: '#111827',
    },
    // Section
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 6,
        borderBottom: '1 solid #E5E7EB',
        paddingBottom: 4,
    },
    // Table
    table: {
        marginBottom: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 6,
        fontWeight: 'bold',
        borderBottom: '1 solid #D1D5DB',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 5,
        borderBottom: '1 solid #F3F4F6',
    },
    tableRowAlt: {
        flexDirection: 'row',
        padding: 5,
        borderBottom: '1 solid #F3F4F6',
        backgroundColor: '#FAFAFA',
    },
    tableCell: {
        fontSize: 8,
        color: '#374151',
    },
    tableCellHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
    },
    tableCellRight: {
        fontSize: 8,
        color: '#374151',
        textAlign: 'right',
    },
    tableCellHeaderRight: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'right',
    },
    // Financial summary
    totals: {
        alignItems: 'flex-end',
        marginTop: 15,
    },
    totalRow: {
        flexDirection: 'row',
        width: 220,
        marginBottom: 3,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    totalLabel: {
        flex: 1,
        fontSize: 10,
        color: '#374151',
    },
    totalValue: {
        width: 90,
        textAlign: 'right',
        fontSize: 10,
    },
    grandTotal: {
        flexDirection: 'row',
        width: 220,
        marginTop: 6,
        padding: 10,
        backgroundColor: '#ECFDF5',
        borderRadius: 4,
        border: '1 solid #10B981',
    },
    grandTotalLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: 'bold',
        color: '#059669',
    },
    grandTotalValue: {
        width: 90,
        textAlign: 'right',
        fontSize: 13,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 'auto',
        paddingTop: 10,
        borderTop: '1 solid #E5E7EB',
        fontSize: 7,
        color: '#9CA3AF',
    },
    negative: { color: '#DC2626' },
    positive: { color: '#059669' },
    badge: {
        fontSize: 7,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
        color: '#FFFFFF',
    },
});

interface SettlementPDFProps {
    settlement: any;
    company: any;
    driver: any;
    loads: any[];
    deductionItems: any[];
    advances: any[];
    deductionRules: any[];
}

export function SettlementPDF({ settlement, company, driver, loads, deductionItems, advances, deductionRules }: SettlementPDFProps) {
    const fmt = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const fmtDate = (date: Date | string) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const fmtShortDate = (date: Date | string) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const fmtPayType = (payType: string, payRate: number) => {
        switch (payType) {
            case 'PER_MILE': return `${fmt(payRate)}/mile`;
            case 'PERCENTAGE': return `${payRate}%`;
            case 'PER_LOAD': return `${fmt(payRate)}/load`;
            case 'HOURLY': return `${fmt(payRate)}/hr`;
            default: return 'N/A';
        }
    };

    const totalMiles = loads.reduce((s, l) => s + (l.totalMiles || l.loadedMiles || l.emptyMiles || 0), 0);
    const loadedMiles = loads.reduce((s, l) => s + (l.loadedMiles || 0), 0);

    // Separate deduction rules into deductions vs additions
    const recurringDeductions = deductionRules.filter((r: any) => !r.isAddition);
    const recurringAdditions = deductionRules.filter((r: any) => r.isAddition);

    // Separate deduction items into actual deductions vs additions
    const actualDeductions = deductionItems.filter((d: any) => d.category !== 'addition');
    const actualAdditions = deductionItems.filter((d: any) => d.category === 'addition');

    const freqMap: Record<string, string> = {
        WEEKLY: 'Weekly', MONTHLY: 'Monthly', BIWEEKLY: 'Bi-Weekly',
        PER_SETTLEMENT: 'Per Settlement', ONE_TIME: 'One Time',
    };

    const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const renderRuleRow = (rule: any, index: number) => {
        let amountDisplay = '';
        if (rule.calculationType === 'FIXED' && rule.amount) amountDisplay = fmt(rule.amount);
        else if (rule.calculationType === 'PERCENTAGE') amountDisplay = `${rule.percentage}%`;
        else if (rule.calculationType === 'PER_MILE') amountDisplay = `${fmt(rule.perMileRate || 0)}/mi`;

        const cleanName = rule.name.replace(/^Driver .*? - /, '');
        const display = rule.deductionType === 'OTHER' ? cleanName : typeLabel(rule.deductionType);
        const freq = freqMap[rule.deductionFrequency || rule.frequency] || rule.frequency || '';
        const balance = rule.goalAmount
            ? `${fmt(rule.currentAmount || 0)} / ${fmt(rule.goalAmount)}`
            : '';

        return (
            <View key={rule.id || index} style={index % 2 ? styles.tableRowAlt : styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2.5 }]}>{display}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{balance || freq}</Text>
                <Text style={[styles.tableCellRight, { flex: 1.5 }]}>{amountDisplay} / {freq}</Text>
            </View>
        );
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        {company?.logoUrl && <Image style={styles.logo} src={company.logoUrl} />}
                        {company && !company.hideName && (
                            <Text style={styles.companyName}>{company.name || 'Trucking Company'}</Text>
                        )}
                        {company?.address && <Text style={styles.companyDetail}>{company.address}</Text>}
                        {company?.city && company?.state && (
                            <Text style={styles.companyDetail}>{company.city}, {company.state} {company.zip}</Text>
                        )}
                        {company?.phone && <Text style={styles.companyDetail}>{company.phone}</Text>}
                    </View>
                    <View>
                        <Text style={styles.settlementTitle}>SETTLEMENT</Text>
                        <Text style={styles.settlementNumber}>{settlement.settlementNumber}</Text>
                    </View>
                </View>

                {/* Settlement + Driver Info Side by Side */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoBoxTitle}>Settlement</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Period:</Text>
                            <Text style={styles.infoValue}>{fmtShortDate(settlement.periodStart)} - {fmtShortDate(settlement.periodEnd)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status:</Text>
                            <Text style={styles.infoValue}>{settlement.status}</Text>
                        </View>
                        {settlement.paidDate && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Paid:</Text>
                                <Text style={styles.infoValue}>{fmtDate(settlement.paidDate)}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoBoxTitle}>Driver</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Name:</Text>
                            <Text style={styles.infoValue}>{driver.user.firstName} {driver.user.lastName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Pay Rate:</Text>
                            <Text style={styles.infoValue}>{fmtPayType(driver.payType, driver.payRate)}</Text>
                        </View>
                        {driver.user.email && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Email:</Text>
                                <Text style={styles.infoValue}>{driver.user.email}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Loads Summary */}
                {loads.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Loads Summary ({loads.length} loads)</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCellHeader, { width: 65 }]}>Load #</Text>
                                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Route</Text>
                                <Text style={[styles.tableCellHeaderRight, { width: 50 }]}>Miles</Text>
                                <Text style={[styles.tableCellHeaderRight, { width: 65 }]}>Driver Pay</Text>
                                <Text style={[styles.tableCellHeaderRight, { width: 55 }]}>Pickup</Text>
                                <Text style={[styles.tableCellHeaderRight, { width: 55 }]}>Delivery</Text>
                                <Text style={[styles.tableCellHeaderRight, { width: 55 }]}>Delivered</Text>
                            </View>
                            {loads.map((load: any, i: number) => (
                                <View key={load.id || i} style={i % 2 ? styles.tableRowAlt : styles.tableRow} wrap={false}>
                                    <Text style={[styles.tableCell, { width: 65, fontSize: 7 }]}>{load.loadNumber || 'N/A'}</Text>
                                    <Text style={[styles.tableCell, { flex: 2, fontSize: 7 }]}>
                                        {load.pickupCity}, {load.pickupState} → {load.deliveryCity}, {load.deliveryState}
                                    </Text>
                                    <Text style={[styles.tableCellRight, { width: 50 }]}>
                                        {(load.totalMiles || load.loadedMiles || load.emptyMiles || 0).toLocaleString()}
                                    </Text>
                                    <Text style={[styles.tableCellRight, { width: 65 }]}>{fmt(load.driverPay || 0)}</Text>
                                    <Text style={[styles.tableCellRight, { width: 55, fontSize: 7 }]}>
                                        {load.pickupDate ? fmtShortDate(load.pickupDate) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCellRight, { width: 55, fontSize: 7 }]}>
                                        {load.deliveryDate ? fmtShortDate(load.deliveryDate) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCellRight, { width: 55, fontSize: 7 }]}>
                                        {load.deliveredAt ? fmtShortDate(load.deliveredAt) : '-'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text style={{ fontSize: 8, color: '#6B7280' }}>
                            Total: {totalMiles.toLocaleString()} miles (Loaded: {loadedMiles.toLocaleString()})
                        </Text>
                    </View>
                )}

                {/* Additions */}
                {actualAdditions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additions</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCellHeader, { flex: 3 }]}>Description</Text>
                                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Type</Text>
                                <Text style={[styles.tableCellHeaderRight, { width: 80 }]}>Amount</Text>
                            </View>
                            {actualAdditions.map((item: any, i: number) => (
                                <View key={item.id || i} style={i % 2 ? styles.tableRowAlt : styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 3 }]}>
                                        {(item.description || '').replace(/^Driver .*? - /, '')}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>{typeLabel(item.deductionType || '')}</Text>
                                    <Text style={[styles.tableCellRight, { width: 80 }, styles.positive]}>
                                        +{fmt(item.amount)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Deductions */}
                {actualDeductions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Deductions</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCellHeader, { flex: 3 }]}>Description</Text>
                                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Type</Text>
                                <Text style={[styles.tableCellHeaderRight, { width: 80 }]}>Amount</Text>
                            </View>
                            {actualDeductions.map((item: any, i: number) => (
                                <View key={item.id || i} style={i % 2 ? styles.tableRowAlt : styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 3 }]}>
                                        {(item.description || '').replace(/^Driver .*? - /, '')}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>{typeLabel(item.deductionType || '')}</Text>
                                    <Text style={[styles.tableCellRight, { width: 80 }, styles.negative]}>
                                        -{fmt(item.amount)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Recurring Deductions Status */}
                {recurringDeductions.length > 0 && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.sectionTitle}>Recurring Deductions</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCellHeader, { flex: 2.5 }]}>Type</Text>
                                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Balance / Frequency</Text>
                                <Text style={[styles.tableCellHeaderRight, { flex: 1.5 }]}>Amount</Text>
                            </View>
                            {recurringDeductions.map(renderRuleRow)}
                        </View>
                    </View>
                )}

                {/* Recurring Additions Status */}
                {recurringAdditions.length > 0 && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.sectionTitle}>Recurring Additions</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCellHeader, { flex: 2.5 }]}>Type</Text>
                                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Balance / Frequency</Text>
                                <Text style={[styles.tableCellHeaderRight, { flex: 1.5 }]}>Amount</Text>
                            </View>
                            {recurringAdditions.map(renderRuleRow)}
                        </View>
                    </View>
                )}

                {/* Financial Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    <View style={styles.totals}>
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Gross Pay:</Text>
                            <Text style={styles.totalValue}>{fmt(settlement.grossPay)}</Text>
                        </View>
                        {actualAdditions.length > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Additions:</Text>
                                <Text style={[styles.totalValue, styles.positive]}>
                                    +{fmt(actualAdditions.reduce((s: number, d: any) => s + d.amount, 0))}
                                </Text>
                            </View>
                        )}
                        {settlement.deductions > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Deductions:</Text>
                                <Text style={[styles.totalValue, styles.negative]}>
                                    -{fmt(settlement.deductions)}
                                </Text>
                            </View>
                        )}
                        {settlement.advances > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Advances:</Text>
                                <Text style={[styles.totalValue, styles.negative]}>
                                    -{fmt(settlement.advances)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.grandTotal}>
                            <Text style={styles.grandTotalLabel}>Net Pay:</Text>
                            <Text style={[styles.grandTotalValue, settlement.netPay >= 0 ? styles.positive : styles.negative]}>
                                {fmt(settlement.netPay)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                {settlement.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={{ fontSize: 9, color: '#4B5563' }}>{settlement.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    {(!company || !company.hideFooter) && (
                        <Text>Generated on {fmtDate(new Date())} | All amounts in USD</Text>
                    )}
                    {company?.name && !company.hideName && !company.hideFooter && (
                        <Text style={{ marginTop: 2 }}>{company.name}</Text>
                    )}
                </View>
            </Page>
        </Document>
    );
}
