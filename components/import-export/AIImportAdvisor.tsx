'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface AIAnalysisResult {
    summary: string;
    tips: string[];
    confidence: 'High' | 'Medium' | 'Low';
    suggestedMapping?: Record<string, string>;
}

interface AIImportAdvisorProps {
    analysis: AIAnalysisResult | null;
    isAnalyzing: boolean;
    isMapping?: boolean;
}

export function AIImportAdvisor({ analysis, isAnalyzing, isMapping }: AIImportAdvisorProps) {
    if (!analysis && !isAnalyzing && !isMapping) return null;

    return (
        <section className="mt-6 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">AI Import Advisor</h4>
                        <div className="flex gap-2">
                            {isMapping && (
                                <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-600 animate-pulse">
                                    Mapping Columns...
                                </Badge>
                            )}
                            {analysis?.confidence && (
                                <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                                    {analysis.confidence} Confidence
                                </Badge>
                            )}
                        </div>
                    </div>

                    {(isAnalyzing || isMapping) ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {isMapping ? 'Matching columns semantically...' : 'Analyzing file structure and data quality...'}
                        </div>
                    ) : analysis ? (
                        <>
                            <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                                {analysis.summary}
                            </p>

                            {analysis.tips && analysis.tips.length > 0 && (
                                <div className="bg-white/50 dark:bg-black/20 rounded p-3 text-xs space-y-1.5">
                                    {analysis.tips.map((tip, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="text-indigo-500">•</span>
                                            <span className="text-indigo-900 dark:text-indigo-100">{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
