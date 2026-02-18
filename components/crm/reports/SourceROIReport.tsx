'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function SourceROIReport() {
    const { data, isLoading } = useQuery({
        queryKey: ['crm-report-source'],
        queryFn: async () => {
            const res = await fetch('/api/crm/reports?type=source');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

    const rows = data?.data || [];

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Leads and hires by source, with conversion rates.
            </p>
            {rows.length === 0 ? (
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
