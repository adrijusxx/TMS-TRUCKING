import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';

interface RuleApplicationLogProps {
    auditLog: any;
}

/**
 * Surfaces the deduction/addition rules applied during settlement calculation
 * as a readable table — extracted from the calculationLog JSON.
 */
export function RuleApplicationLog({ auditLog }: RuleApplicationLogProps) {
    if (!auditLog) return null;

    const additions = auditLog.additions || [];
    const deductions = auditLog.deductions || [];
    const advances = auditLog.advances || [];

    const hasItems = additions.length > 0 || deductions.length > 0 || advances.length > 0;

    if (!hasItems) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No rules were applied during this settlement calculation.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {additions.length > 0 && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Additions Applied
                            <Badge variant="secondary" className="text-xs">{additions.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {additions.map((item: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs bg-green-50">
                                                {item.type?.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{item.description}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {item.reference?.startsWith('accessorial_') ? 'Accessorial' :
                                             item.reference?.startsWith('expense_') ? 'Load Expense' :
                                             item.reference?.startsWith('deduction_rule_') ? 'Deduction Rule' : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            +{formatCurrency(item.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={3} className="font-medium text-sm">Total Additions</TableCell>
                                    <TableCell className="text-right font-bold text-green-600">
                                        +{formatCurrency(additions.reduce((s: number, a: any) => s + a.amount, 0))}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {deductions.length > 0 && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Deductions Applied
                            <Badge variant="secondary" className="text-xs">{deductions.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deductions.map((item: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs bg-red-50">
                                                {item.type?.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{item.description}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {item.metadata?.deductionRuleId ? 'Deduction Rule' :
                                             item.reference?.startsWith('fuel_') ? 'Fuel Entry' :
                                             item.reference?.startsWith('advance_') ? 'Advance' : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-red-600">
                                            -{formatCurrency(item.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={3} className="font-medium text-sm">Total Deductions</TableCell>
                                    <TableCell className="text-right font-bold text-red-600">
                                        -{formatCurrency(deductions.reduce((s: number, d: any) => s + d.amount, 0))}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {advances.length > 0 && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Advances Deducted
                            <Badge variant="secondary" className="text-xs">{advances.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Advance #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {advances.map((adv: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium text-sm">{adv.advanceNumber || '-'}</TableCell>
                                        <TableCell className="text-sm">
                                            {adv.requestDate ? new Date(adv.requestDate).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{adv.notes || '-'}</TableCell>
                                        <TableCell className="text-right font-medium text-red-600">
                                            -{formatCurrency(adv.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={3} className="font-medium text-sm">Total Advances</TableCell>
                                    <TableCell className="text-right font-bold text-red-600">
                                        -{formatCurrency(advances.reduce((s: number, a: any) => s + a.amount, 0))}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
