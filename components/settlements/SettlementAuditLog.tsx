import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RuleApplicationLog } from './RuleApplicationLog';
import { SettlementComparison } from './SettlementComparison';

interface SettlementAuditLogProps {
    auditLog?: any;
    calculationHistory?: any[];
    grossPay?: number;
    netPay?: number;
    deductions?: number;
}

export function SettlementAuditLog({ auditLog, calculationHistory, grossPay, netPay, deductions }: SettlementAuditLogProps) {
    if (!auditLog) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    No audit log available for this settlement.
                    <p className="text-sm mt-2">Settlements created before this feature was added do not have detailed audit logs.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Calculation Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Calculated At</span>
                            <span className="font-medium">{formatDate(auditLog.calculatedAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-medium">{auditLog.version}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Driver Pay Type</span>
                            <Badge variant="outline">{auditLog.driverPayType}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Pay Rate</span>
                            <span className="font-medium">
                                {auditLog.driverPayType === 'PERCENTAGE'
                                    ? `${auditLog.driverPayRate}%`
                                    : formatCurrency(auditLog.driverPayRate)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Financial Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Gross Pay</span>
                            <span className="font-medium">{formatCurrency(auditLog.grossPay)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span className="text-muted-foreground">Additions</span>
                            <span className="font-medium">+{formatCurrency(auditLog.additions.reduce((s: number, a: any) => s + a.amount, 0))}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span className="text-muted-foreground">Deductions</span>
                            <span className="font-medium">-{formatCurrency(auditLog.deductions.reduce((s: number, d: any) => s + d.amount, 0))}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-bold">
                            <span>Net Pay</span>
                            <span>{formatCurrency(auditLog.netPay)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Load Calculation Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Load #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Rule Applied</TableHead>
                                    <TableHead className="text-right">Miles</TableHead>
                                    <TableHead className="text-right">Revenue/Rate</TableHead>
                                    <TableHead className="text-right">Calculated Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditLog.loads?.map((load: any) => (
                                    <TableRow key={load.loadId}>
                                        <TableCell className="font-medium">{load.loadNumber}</TableCell>
                                        <TableCell>{formatDate(load.deliveryDate)}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {load.appliedRule}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {load.totalMiles > 0 ? `${load.totalMiles} mi` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {load.payType === 'PERCENTAGE' ? (
                                                <div className="flex flex-col items-end text-xs">
                                                    <span>{formatCurrency(load.revenue)} (Rev)</span>
                                                    {load.fuelSurcharge > 0 && <span className="text-muted-foreground">-{formatCurrency(load.fuelSurcharge)} (FSC)</span>}
                                                </div>
                                            ) : (
                                                formatCurrency(load.payRate)
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(load.calculatedPay)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Rule Application Log — shows additions, deductions, advances as readable tables */}
            <RuleApplicationLog auditLog={auditLog} />

            {/* Recalculation History — shows before/after comparison for each recalculation */}
            {calculationHistory && calculationHistory.length > 0 && (
                <SettlementComparison
                    calculationHistory={calculationHistory}
                    currentLog={auditLog}
                    currentGrossPay={grossPay ?? 0}
                    currentNetPay={netPay ?? 0}
                    currentDeductions={deductions ?? 0}
                />
            )}

            {/* Raw JSON for Debugging (Collapsible) */}
            <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer mb-2">Raw Audit Log JSON</summary>
                <pre className="bg-muted p-4 rounded overflow-auto max-h-60">
                    {JSON.stringify(auditLog, null, 2)}
                </pre>
            </details>
        </div>
    );
}
