'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function BatchSettlementTrigger() {
    const [isLoading, setIsLoading] = useState(false);

    const handleRunBatch = async () => {
        if (!confirm('This will generate settlements for ALL drivers for the PREVIOUS WEEK. Continue?')) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/settlements/trigger-generation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    period: 'last_week',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to trigger settlement generation');
            }

            toast.success('Batch Settlement Generation Started', {
                description: 'The process runs in the background. Check the Approval Queue shortly.',
                duration: 5000,
            });
        } catch (error: any) {
            toast.error('Error', {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="default"
            onClick={handleRunBatch}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Run Weekly Batch
        </Button>
    );
}
