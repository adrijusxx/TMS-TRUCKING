'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Clock,
    DollarSign,
    CheckCircle2,
    ChevronRight,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface SimilarCase {
    id: string;
    breakdownNumber: string;
    problem: string;
    description: string;
    solution: string;
    breakdownType: string;
    priority: string;
    truckNumber: string;
    resolvedAt: Date | null;
    resolutionTimeHours: number | null;
    totalCost: number;
    similarity: number;
    reason: string;
}

interface SimilarCasesPanelProps {
    description: string;
    truckId?: string;
    breakdownType?: string;
    onUseSolution?: (caseData: SimilarCase) => void;
}

export default function SimilarCasesPanel({
    description,
    truckId,
    breakdownType,
    onUseSolution,
}: SimilarCasesPanelProps) {
    const [cases, setCases] = useState<SimilarCase[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCase, setExpandedCase] = useState<string | null>(null);

    const fetchSimilarCases = async () => {
        if (!description || description.length < 10) {
            toast.error('Please enter a more detailed description');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(apiUrl('/api/breakdowns/similar'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, truckId, breakdownType }),
            });

            if (!response.ok) throw new Error('Failed to find similar cases');

            const data = await response.json();
            setCases(data.data || []);

            if (data.data.length === 0) {
                toast.info('No similar cases found in history');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to find similar cases');
        } finally {
            setIsLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-red-500';
            case 'HIGH': return 'bg-orange-500';
            case 'MEDIUM': return 'bg-yellow-500';
            case 'LOW': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Similar Cases
                        </CardTitle>
                        <CardDescription>
                            Find solutions from past breakdowns
                        </CardDescription>
                    </div>
                    <Button
                        onClick={fetchSimilarCases}
                        disabled={isLoading || !description}
                        size="sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            'Find Similar'
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {cases.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">
                            Enter a description and click "Find Similar" to see past cases
                        </p>
                    </div>
                )}

                {cases.length > 0 && (
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                            {cases.map((caseItem) => (
                                <div
                                    key={caseItem.id}
                                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm">
                                                    {caseItem.breakdownNumber}
                                                </span>
                                                <Badge className={`${getPriorityColor(caseItem.priority)} text-xs`}>
                                                    {caseItem.priority}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {Math.round(caseItem.similarity * 10)}/10 match
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium">{caseItem.problem}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Truck: {caseItem.truckNumber}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setExpandedCase(expandedCase === caseItem.id ? null : caseItem.id)
                                            }
                                        >
                                            <ChevronRight
                                                className={`h-4 w-4 transition-transform ${expandedCase === caseItem.id ? 'rotate-90' : ''
                                                    }`}
                                            />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                        {caseItem.resolutionTimeHours && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {caseItem.resolutionTimeHours}h
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            ${caseItem.totalCost.toLocaleString()}
                                        </div>
                                        {caseItem.resolvedAt && (
                                            <span>
                                                {formatDistanceToNow(new Date(caseItem.resolvedAt), { addSuffix: true })}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground italic mb-2">
                                        Why similar: {caseItem.reason}
                                    </p>

                                    {expandedCase === caseItem.id && (
                                        <div className="mt-3 pt-3 border-t space-y-2">
                                            <div>
                                                <p className="text-xs font-semibold mb-1">Problem Details:</p>
                                                <p className="text-xs text-muted-foreground">{caseItem.description}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold mb-1">Solution:</p>
                                                <p className="text-xs text-muted-foreground">{caseItem.solution}</p>
                                            </div>
                                            {onUseSolution && (
                                                <Button
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={() => onUseSolution(caseItem)}
                                                >
                                                    Use This Solution
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
