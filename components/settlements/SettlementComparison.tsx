import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SettlementComparisonProps {
    calculationHistory: any[];
    currentLog: any;
    currentGrossPay: number;
    currentNetPay: number;
    currentDeductions: number;
}

function DiffBadge({ prev, curr }: { prev: number; curr: number }) {
    const diff = curr - prev;
    if (Math.abs(diff) < 0.01) {
        return <Badge variant="secondary" className="text-xs"><Minus className="h-3 w-3 mr-0.5" />No change</Badge>;
    }
    if (diff > 0) {
        return <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
            <TrendingUp className="h-3 w-3 mr-0.5" />+{formatCurrency(diff)}
        </Badge>;
    }
    return <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100">
        <TrendingDown className="h-3 w-3 mr-0.5" />{formatCurrency(diff)}
    </Badge>;
}

/**
 * Shows a history of settlement recalculations with side-by-side comparison
 * of previous vs current values.
 */
export function SettlementComparison({
    calculationHistory,
    currentLog,
    currentGrossPay,
    currentNetPay,
    currentDeductions,
}: SettlementComparisonProps) {
    if (!calculationHistory || calculationHistory.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No recalculation history. This settlement has not been recalculated.
                </CardContent>
            </Card>
        );
    }

    // Sort by snapshotAt descending (most recent first)
    const history = [...calculationHistory].sort((a, b) =>
        new Date(b.snapshotAt || 0).getTime() - new Date(a.snapshotAt || 0).getTime()
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">
                        Recalculation History ({history.length} revision{history.length > 1 ? 's' : ''})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="max-h-[500px]">
                        <div className="space-y-4">
                            {history.map((snapshot, idx) => {
                                // Compare this snapshot with the next one (or current values for most recent)
                                const isLatest = idx === 0;
                                const compareGross = isLatest ? currentGrossPay : history[idx - 1]?.previousGrossPay;
                                const compareNet = isLatest ? currentNetPay : history[idx - 1]?.previousNetPay;
                                const compareDed = isLatest ? currentDeductions : history[idx - 1]?.previousDeductions;

                                return (
                                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    Revision {history.length - idx}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {snapshot.snapshotAt ? formatDate(snapshot.snapshotAt) : 'Unknown date'}
                                                </span>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {snapshot.snapshotReason || 'recalculation'}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Gross Pay</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground line-through">
                                                        {formatCurrency(snapshot.previousGrossPay ?? snapshot.grossPay ?? 0)}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {formatCurrency(compareGross ?? 0)}
                                                    </span>
                                                </div>
                                                <DiffBadge
                                                    prev={snapshot.previousGrossPay ?? snapshot.grossPay ?? 0}
                                                    curr={compareGross ?? 0}
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Deductions</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground line-through">
                                                        {formatCurrency(snapshot.previousDeductions ?? 0)}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {formatCurrency(compareDed ?? 0)}
                                                    </span>
                                                </div>
                                                <DiffBadge
                                                    prev={snapshot.previousDeductions ?? 0}
                                                    curr={compareDed ?? 0}
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Net Pay</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground line-through">
                                                        {formatCurrency(snapshot.previousNetPay ?? snapshot.netPay ?? 0)}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {formatCurrency(compareNet ?? 0)}
                                                    </span>
                                                </div>
                                                <DiffBadge
                                                    prev={snapshot.previousNetPay ?? snapshot.netPay ?? 0}
                                                    curr={compareNet ?? 0}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
