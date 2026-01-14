
'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
    RefreshCw,
    CheckCircle2,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import SettlementDraftSheet from '../sheets/SettlementDraftSheet';

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

export default function PendingSettlementsTab() {
    const queryClient = useQueryClient();
    const [selectedDrivers, setSelectedDrivers] = React.useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [selectedDraft, setSelectedDraft] = React.useState<DraftSettlement | null>(null);
    const [sheetOpen, setSheetOpen] = React.useState(false);

    // Fetch draft settlements
    const { data: drafts, isLoading, error } = useQuery<DraftSettlement[]>({
        queryKey: ['draft-settlements'],
        queryFn: async () => {
            const response = await fetch(apiUrl('/api/settlements/draft-batch'));
            if (!response.ok) throw new Error('Failed to fetch draft settlements');
            const result = await response.json();
            return result.data || [];
        },
    });

    const generateMutation = useMutation({
        mutationFn: async (driverIds: string[]) => {
            const draftsToGenerate = drafts?.filter(d => driverIds.includes(d.driver.id)) || [];

            // Generate sequentially to avoid DB locks/issues
            const results = [];
            for (const draft of draftsToGenerate) {
                const response = await fetch(apiUrl('/api/settlements/generate'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driverId: draft.driver.id,
                        loadIds: draft.loads.map(l => l.id),
                        deductions: 0, // Manual deduction placeholder
                        advances: 0,
                        notes: 'Batch generated from Pending Settlements'
                    }),
                });

                if (!response.ok) {
                    const errorIdx = results.push({ success: false, driver: draft.driver.name });
                    console.error(`Failed to generate for ${draft.driver.name}`);
                } else {
                    results.push({ success: true, driver: draft.driver.name });
                }
            }
            return results;
        },
        onSuccess: (results) => {
            const successes = results.filter(r => r.success).length;
            const failures = results.filter(r => !r.success).length;

            if (successes > 0) toast.success(`Successfully generated ${successes} settlements`);
            if (failures > 0) toast.error(`Failed to generate ${failures} settlements`);

            setSelectedDrivers(new Set());
            queryClient.invalidateQueries({ queryKey: ['draft-settlements'] });
            queryClient.invalidateQueries({ queryKey: ['salary-batches'] }); // Refresh processed tab
        },
        onError: () => {
            toast.error('Failed to process batch generation');
        },
        onSettled: () => {
            setIsGenerating(false);
        }
    });

    const handleSelectAll = () => {
        if (!drafts) return;
        if (selectedDrivers.size === drafts.length) {
            setSelectedDrivers(new Set());
        } else {
            setSelectedDrivers(new Set(drafts.map(d => d.driver.id)));
        }
    };

    const handleSelect = (id: string) => {
        const newSet = new Set(selectedDrivers);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedDrivers(newSet);
    };

    const handleGenerateSelected = () => {
        if (selectedDrivers.size === 0) return;
        if (confirm(`Are you sure you want to generate ${selectedDrivers.size} settlements?`)) {
            setIsGenerating(true);
            generateMutation.mutate(Array.from(selectedDrivers));
        }
    };

    const handleRowClick = (draft: DraftSettlement) => {
        setSelectedDraft(draft);
        setSheetOpen(true);
    };

    const handleGenerateSingle = (driverId: string) => {
        setIsGenerating(true);
        generateMutation.mutate([driverId], {
            onSuccess: () => {
                setSheetOpen(false);
                setSelectedDraft(null);
            }
        });
    };

    if (error) {
        return (
            <div className="text-center py-8 text-destructive border rounded-lg bg-destructive/10">
                <p>Failed to load pending settlements.</p>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['draft-settlements'] })} className="mt-2">
                    Try Again
                </Button>
            </div>
        );
    }

    const totalSelectedNet = drafts
        ?.filter(d => selectedDrivers.has(d.driver.id))
        .reduce((sum, d) => sum + d.netPay, 0) || 0;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Pending Generation</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">{drafts?.length || 0}</span>
                            <span className="text-xs text-muted-foreground">drivers</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Selected Total</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">{formatCurrency(totalSelectedNet)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['draft-settlements'] })}
                        disabled={isLoading || isGenerating}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Button
                        size="default"
                        disabled={selectedDrivers.size === 0 || isGenerating}
                        onClick={handleGenerateSelected}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isGenerating ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Generate {selectedDrivers.size > 0 ? `(${selectedDrivers.size})` : ''} Settlements
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={drafts && drafts.length > 0 && selectedDrivers.size === drafts.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-medium">Driver</TableHead>
                            <TableHead className="font-medium text-center">Period</TableHead>
                            <TableHead className="font-medium text-center">Loads</TableHead>
                            <TableHead className="font-medium text-right">Gross Pay</TableHead>
                            <TableHead className="font-medium text-right text-green-600">Additions</TableHead>
                            <TableHead className="font-medium text-right text-red-600">Deductions</TableHead>
                            <TableHead className="font-medium text-right text-orange-600">Advances</TableHead>
                            <TableHead className="font-medium text-right">Net Pay</TableHead>
                            <TableHead className="w-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : drafts && drafts.length > 0 ? (
                            drafts.map((draft) => (
                                <TableRow
                                    key={draft.driver.id}
                                    className={`hover:bg-muted/50 cursor-pointer ${selectedDrivers.has(draft.driver.id) ? 'bg-muted/30' : ''}`}
                                    onClick={() => handleRowClick(draft)}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedDrivers.has(draft.driver.id)}
                                            onCheckedChange={() => handleSelect(draft.driver.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-primary hover:underline">{draft.driver.name}</span>
                                            {draft.driver.truckNumber && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1 py-0">{draft.driver.truckNumber}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">
                                        {format(new Date(draft.period.start), 'M/d')} - {format(new Date(draft.period.end), 'M/d')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-mono">{draft.loadCount}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(draft.grossPay)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 text-sm">
                                        {draft.totalAdditions > 0 ? `+${formatCurrency(draft.totalAdditions)}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-red-600 text-sm">
                                        {draft.totalDeductions > 0 ? `-${formatCurrency(draft.totalDeductions)}` : '-'}
                                        {draft.negativeBalanceDeduction > 0 && (
                                            <div className="text-xs text-red-500" title="Previous negative balance deduction">
                                                (Incl. {formatCurrency(draft.negativeBalanceDeduction)})
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-orange-600 text-sm">
                                        {draft.totalAdvances > 0 ? `-${formatCurrency(draft.totalAdvances)}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-base">
                                        {formatCurrency(draft.netPay)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="View Details">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                                        <p>No pending settlements found.</p>
                                        <p className="text-xs text-muted-foreground">All delivered loads have been settled.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <SettlementDraftSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                draft={selectedDraft}
                onGenerate={handleGenerateSingle}
                isGenerating={isGenerating}
            />
        </div>
    );
}
