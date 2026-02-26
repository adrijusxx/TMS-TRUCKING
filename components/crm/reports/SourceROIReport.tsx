'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import ReportDateFilter, { downloadCsv } from './ReportDateFilter';

export default function SourceROIReport() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['crm-report-source', from, to],
        queryFn: async () => {
            const params = new URLSearchParams({ type: 'source' });
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            const res = await fetch(`/api/crm/reports?${params}`);
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    const rows = data?.data || [];

    const handleExport = () => {
        downloadCsv('source-roi-report.csv',
            ['Source', 'Total Leads', 'Hired', 'Conversion Rate %'],
            rows.map((r: any) => [r.source, r.total, r.hired, r.conversionRate]),
        );
    };

    return (
        <div className="space-y-2">
            <ReportDateFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onExportCsv={handleExport} />
            <p className="text-sm text-muted-foreground">
                Leads and hires by source, with conversion rates.
            </p>
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : rows.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No data yet</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Total Leads</TableHead>
                            <TableHead className="text-right">Hired</TableHead>
                            <TableHead className="text-right">Conversion Rate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row: any) => (
                            <TableRow key={row.source}>
                                <TableCell>
                                    <Badge variant="outline">{row.source}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">{row.total}</TableCell>
                                <TableCell className="text-right font-medium text-green-600">{row.hired}</TableCell>
                                <TableCell className="text-right">
                                    <span className={row.conversionRate >= 20 ? 'text-green-600' : row.conversionRate >= 10 ? 'text-yellow-600' : 'text-red-600'}>
                                        {row.conversionRate}%
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
