'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trophy } from 'lucide-react';
import ReportDateFilter, { downloadCsv } from './ReportDateFilter';

export default function RecruiterPerformanceReport() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['crm-report-recruiter', from, to],
        queryFn: async () => {
            const params = new URLSearchParams({ type: 'recruiter' });
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            const res = await fetch(`/api/crm/reports?${params}`);
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    const rows = data?.data || [];

    const handleExport = () => {
        downloadCsv('recruiter-performance-report.csv',
            ['Rank', 'Recruiter', 'Total Leads', 'Hired', 'Conversion Rate %'],
            rows.map((r: any, i: number) => [i + 1, r.name, r.totalLeads, r.hired, r.conversionRate]),
        );
    };

    return (
        <div className="space-y-2">
            <ReportDateFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} onExportCsv={handleExport} />
            <p className="text-sm text-muted-foreground">
                Recruiter leaderboard — leads assigned and hired per team member.
            </p>
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : rows.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                    No leads have been assigned to recruiters yet.
                </p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Recruiter</TableHead>
                            <TableHead className="text-right">Total Leads</TableHead>
                            <TableHead className="text-right">Hired</TableHead>
                            <TableHead className="text-right">Conversion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row: any, i: number) => (
                            <TableRow key={row.recruiterId}>
                                <TableCell>
                                    {i === 0 ? <Trophy className="h-4 w-4 text-yellow-500" /> : <span className="text-muted-foreground">#{i + 1}</span>}
                                </TableCell>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell className="text-right">{row.totalLeads}</TableCell>
                                <TableCell className="text-right text-green-600 font-medium">{row.hired}</TableCell>
                                <TableCell className="text-right">
                                    <span className={row.conversionRate >= 20 ? 'text-green-600' : 'text-muted-foreground'}>
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
