'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import ReportDateFilter, { downloadCsv } from './ReportDateFilter';

export default function TimeInStageReport() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['crm-report-time-in-stage', from, to],
        queryFn: async () => {
            const params = new URLSearchParams({ type: 'time-in-stage' });
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            const res = await fetch(`/api/crm/reports?${params}`);
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    const rows = data?.data || [];

    const handleExport = () => {
        downloadCsv('time-in-stage-report.csv',
            ['Stage', 'Avg Days', 'Transitions'],
            rows.map((r: any) => [r.status.replace(/_/g, ' '), r.avgDays, r.transitions]),
        );
    };

    return (
        <div className="space-y-2">
            <ReportDateFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onExportCsv={handleExport} />
            <p className="text-sm text-muted-foreground">
                Average time leads spend before transitioning to each stage.
            </p>
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : rows.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                    Not enough status change data yet. This report populates as leads move through the pipeline.
                </p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Stage</TableHead>
                            <TableHead className="text-right">Avg Days</TableHead>
                            <TableHead className="text-right">Transitions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row: any) => (
                            <TableRow key={row.status}>
                                <TableCell className="font-medium">{row.status.replace(/_/g, ' ')}</TableCell>
                                <TableCell className="text-right">
                                    <span className={row.avgDays > 7 ? 'text-red-600' : row.avgDays > 3 ? 'text-yellow-600' : 'text-green-600'}>
                                        {row.avgDays} days
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{row.transitions}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
