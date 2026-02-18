'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

export default function TimeInStageReport() {
    const { data, isLoading } = useQuery({
        queryKey: ['crm-report-time-in-stage'],
        queryFn: async () => {
            const res = await fetch('/api/crm/reports?type=time-in-stage');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

    const rows = data?.data || [];

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Average time leads spend before transitioning to each stage.
            </p>
            {rows.length === 0 ? (
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
