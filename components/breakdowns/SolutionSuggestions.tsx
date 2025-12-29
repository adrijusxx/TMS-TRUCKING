'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Lightbulb,
    Loader2,
    CheckCircle2,
    Clock,
    DollarSign,
    Wrench,
    AlertTriangle,
} from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface SolutionSuggestion {
    rootCause: string;
    recommendedSteps: string[];
    estimatedTimeHours: number;
    estimatedCost: number;
    requiredParts: string[];
    urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    similarCaseIds: string[];
}

interface SolutionSuggestionsProps {
    description: string;
    problem?: string;
    truckId?: string;
    breakdownType?: string;
    faultCodes?: any[];
    onApplySuggestion?: (suggestion: SolutionSuggestion) => void;
}

export default function SolutionSuggestions({
    description,
    problem,
    truckId,
    breakdownType,
    faultCodes,
    onApplySuggestion,
}: SolutionSuggestionsProps) {
    const [suggestion, setSuggestion] = useState<SolutionSuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSuggestion = async () => {
        if (!description || description.length < 10) {
            toast.error('Please enter a more detailed description');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(apiUrl('/api/breakdowns/suggest-solution'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    problem,
                    truckId,
                    breakdownType,
                    faultCodes
                }),
            });

            if (!response.ok) throw new Error('Failed to get suggestions');

            const data = await response.json();
            setSuggestion(data.data);
            toast.success('AI suggestions generated!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to get suggestions');
        } finally {
            setIsLoading(false);
        }
    };

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'HIGH': return 'bg-red-500';
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
                            <Lightbulb className="h-5 w-5" />
                            AI Solution Suggestions
                        </CardTitle>
                        <CardDescription>
                            Get intelligent recommendations based on past cases
                        </CardDescription>
                    </div>
                    <Button
                        onClick={fetchSuggestion}
                        disabled={isLoading || !description}
                        size="sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Get Suggestions
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {!suggestion && !isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">
                            Click "Get Suggestions" to receive AI-powered recommendations
                        </p>
                    </div>
                )}

                {suggestion && (
                    <div className="space-y-4">
                        {/* Confidence Badge */}
                        <div className="flex items-center justify-between">
                            <Badge className={getUrgencyColor(suggestion.urgencyLevel)}>
                                {suggestion.urgencyLevel} Priority
                            </Badge>
                            <Badge variant="outline">
                                {Math.round(suggestion.confidence * 100)}% Confidence
                            </Badge>
                        </div>

                        {/* Root Cause */}
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold text-sm mb-1">Likely Root Cause:</p>
                                <p className="text-sm">{suggestion.rootCause}</p>
                            </AlertDescription>
                        </Alert>

                        {/* Recommended Steps */}
                        <div>
                            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Recommended Steps:
                            </p>
                            <ol className="list-decimal list-inside space-y-1">
                                {suggestion.recommendedSteps.map((step, index) => (
                                    <li key={index} className="text-sm text-muted-foreground">
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Required Parts */}
                        {suggestion.requiredParts.length > 0 && (
                            <div>
                                <p className="font-semibold text-sm mb-2">Required Parts:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestion.requiredParts.map((part, index) => (
                                        <Badge key={index} variant="secondary">
                                            {part}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Estimates */}
                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                                <p className="text-lg font-semibold flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {suggestion.estimatedTimeHours}h
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Estimated Cost</p>
                                <p className="text-lg font-semibold flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    ${suggestion.estimatedCost.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Similar Cases Reference */}
                        {suggestion.similarCaseIds.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Based on {suggestion.similarCaseIds.length} similar case{suggestion.similarCaseIds.length > 1 ? 's' : ''}
                            </p>
                        )}

                        {/* Apply Button */}
                        {onApplySuggestion && (
                            <Button
                                className="w-full"
                                onClick={() => onApplySuggestion(suggestion)}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Apply These Suggestions
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
