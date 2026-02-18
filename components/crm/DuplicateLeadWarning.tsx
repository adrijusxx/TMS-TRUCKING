'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface DuplicateLeadWarningProps {
    phone?: string;
    email?: string;
    excludeId?: string;
}

interface Duplicate {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    status: string;
    createdAt: string;
    assignedTo?: { firstName: string; lastName: string } | null;
}

export default function DuplicateLeadWarning({ phone, email, excludeId }: DuplicateLeadWarningProps) {
    const [duplicates, setDuplicates] = useState<Duplicate[]>([]);

    const checkDuplicates = useCallback(async () => {
        if (!phone && !email) {
            setDuplicates([]);
            return;
        }

        try {
            const res = await fetch('/api/crm/leads/check-duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, email, excludeId }),
            });
            if (res.ok) {
                const data = await res.json();
                setDuplicates(data.duplicates || []);
            }
        } catch {
            // Silently ignore — duplicate check is advisory
        }
    }, [phone, email, excludeId]);

    useEffect(() => {
        const timer = setTimeout(checkDuplicates, 500);
        return () => clearTimeout(timer);
    }, [checkDuplicates]);

    if (duplicates.length === 0) return null;

    return (
        <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Possible Duplicate Lead</AlertTitle>
            <AlertDescription>
                <div className="space-y-1.5 mt-1">
                    {duplicates.map((dup) => (
                        <div key={dup.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{dup.firstName} {dup.lastName}</span>
                            <span className="text-muted-foreground">{dup.phone}</span>
                            <Badge variant="outline" className="text-xs">{dup.status}</Badge>
                            {dup.assignedTo && (
                                <span className="text-xs text-muted-foreground">
                                    → {dup.assignedTo.firstName} {dup.assignedTo.lastName}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </AlertDescription>
        </Alert>
    );
}
