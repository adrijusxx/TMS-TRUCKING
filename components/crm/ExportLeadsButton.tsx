'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportLeadsButtonProps {
    status?: string;
    priority?: string;
    source?: string;
}

export default function ExportLeadsButton({ status, priority, source }: ExportLeadsButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            if (priority) params.set('priority', priority);
            if (source) params.set('source', source);

            const url = `/api/crm/leads/export${params.toString() ? `?${params}` : ''}`;
            const res = await fetch(url);

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Leads exported successfully');
        } catch {
            toast.error('Failed to export leads');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
        </Button>
    );
}
