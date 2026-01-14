
'use client';

import * as React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, Truck, Calendar } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface DraftSettlement {
    driver: {
        id: string;
        name: string;
        truckNumber?: string;
    };
    period: {
        start: string;
        end: string;
    };
    loadCount: number;
    loads: Array<{ id: string; loadNumber: string; revenue: number }>;
    grossPay: number;
    netPay: number;
    totalDeductions: number;
    totalAdditions: number;
    totalAdvances: number;
    negativeBalanceDeduction: number;
    additions: Array<{ type: string; description: string; amount: number }>;
    deductions: Array<{ type: string; description: string; amount: number }>;
    advances: Array<{ amount: number; description?: string; date: string }>;
}

interface SettlementDraftSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    draft: DraftSettlement | null;
    onGenerate: (driverId: string) => void;
    isGenerating: boolean;
}

export default function SettlementDraftSheet({
    open,
    onOpenChange,
    draft,
    onGenerate,
    isGenerating,
}: SettlementDraftSheetProps) {
    if (!draft) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col p-0 gap-0">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Settlement Preview</SheetTitle>
                        <Badge variant="outline" className="font-mono">
                            {draft.driver.truckNumber || 'No Truck'}
                        </Badge>
                    </div>
                    <SheetDescription className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{draft.driver.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(draft.period.start), 'MMM d')} - {format(new Date(draft.period.end), 'MMM d')}
                        </span>
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-6 pb-6">
                        {/* Financial Summary Card */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mt-2">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Gross Pay</span>
                                    <span>{formatCurrency(draft.grossPay)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Additions</span>
                                    <span>+{formatCurrency(draft.totalAdditions)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Deductions</span>
                                    <span>-{formatCurrency(draft.totalDeductions)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-orange-600">
                                    <span>Advances</span>
                                    <span>-{formatCurrency(draft.totalAdvances)}</span>
                                </div>
                                {draft.negativeBalanceDeduction > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Negative Balance</span>
                                        <span>-{formatCurrency(draft.negativeBalanceDeduction)}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Net Pay</span>
                                    <span>{formatCurrency(draft.netPay)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Loads Section */}
                        <div className="space-y-3">
                            <h3 className="font-medium flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Loads ({draft.loads.length})
                            </h3>
                            <div className="border rounded-md overflow-hidden text-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Load #</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {draft.loads.map((load) => (
                                            <TableRow key={load.id}>
                                                <TableCell className="font-medium">{load.loadNumber}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(load.revenue)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Deductions Section */}
                        {(draft.deductions.length > 0 || draft.advances.length > 0) && (
                            <div className="space-y-3">
                                <h3 className="font-medium flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    Deductions & Advances
                                </h3>
                                <div className="border rounded-md overflow-hidden text-sm">
                                    <Table>
                                        <TableBody>
                                            {draft.advances.map((adv, i) => (
                                                <TableRow key={`adv-${i}`}>
                                                    <TableCell>Advance</TableCell>
                                                    <TableCell className="text-muted-foreground">{format(new Date(adv.date), 'M/d')}</TableCell>
                                                    <TableCell className="text-right font-medium text-orange-600">-{formatCurrency(adv.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                            {draft.deductions.map((ded, i) => (
                                                <TableRow key={`ded-${i}`}>
                                                    <TableCell>{ded.type}</TableCell>
                                                    <TableCell className="text-muted-foreground">{ded.description}</TableCell>
                                                    <TableCell className="text-right font-medium text-red-600">-{formatCurrency(ded.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Additions Section */}
                        {draft.additions.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-medium flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Additions
                                </h3>
                                <div className="border rounded-md overflow-hidden text-sm">
                                    <Table>
                                        <TableBody>
                                            {draft.additions.map((add, i) => (
                                                <TableRow key={`add-${i}`}>
                                                    <TableCell>{add.type}</TableCell>
                                                    <TableCell className="text-muted-foreground">{add.description}</TableCell>
                                                    <TableCell className="text-right font-medium text-green-600">+{formatCurrency(add.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6 pt-2 border-t mt-auto bg-background">
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                        disabled={isGenerating}
                        onClick={() => onGenerate(draft.driver.id)}
                    >
                        {isGenerating ? 'Generating...' : `Generate Settlement (${formatCurrency(draft.netPay)})`}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
