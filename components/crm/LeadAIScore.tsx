'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface LeadAIScoreProps {
    leadId: string;
    leadData: any;
    onScoreUpdate: (score: number, summary: string) => void;
}

function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
}

export default function LeadAIScore({ leadId, leadData, onScoreUpdate }: LeadAIScoreProps) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async (e: React.MouseEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/score`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to generate score');
            const data = await res.json();
            toast.success('AI Analysis Complete');
            onScoreUpdate(data.data.score, data.data.summary);
        } catch {
            toast.error('Failed to generate score');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            AI Fit Score
                        </h3>
                        <p className="text-sm text-muted-foreground">Automated candidate evaluation</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {leadData?.aiScore ? 'Recalculate' : 'Generate Score'}
                    </Button>
                </div>

                {leadData?.aiScore !== null && leadData?.aiScore !== undefined ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className={`text-4xl font-bold ${getScoreColor(leadData.aiScore)}`}>
                                {leadData.aiScore}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Last updated: {leadData.aiScoreUpdatedAt ? format(new Date(leadData.aiScoreUpdatedAt), 'MMM d, h:mm a') : 'Just now'}
                            </div>
                        </div>

                        {leadData.aiScoreSummary && (
                            <div className="bg-muted p-3 rounded-md text-sm">
                                {leadData.aiScoreSummary}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        No score generated yet. Click above to analyze this candidate.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
