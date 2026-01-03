'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Shield,
    Truck,
    Search,
    Filter
} from 'lucide-react';
import { useState } from 'react';
import { apiUrl, formatDate } from '@/lib/utils';
import { getMcContext } from '@/lib/utils/query-keys';

interface UnifiedInspection {
    id: string;
    date: string;
    type: string;
    vehicle: string;
    driver: string;
    location: string;
    result: string;
    source: 'INTERNAL' | 'DOT';
}

function ResultBadge({ result }: { result: string }) {
    if (result === 'Clean' || result === 'Pass') {
        return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Passed</Badge>;
    }
    if (result === 'Violations') {
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Violations</Badge>;
    }
    if (result === 'Out of Service' || result === 'Fail') {
        return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">{result}</Badge>;
}

export default function InspectionsTable() {
    const mcContext = getMcContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'DOT' | 'INTERNAL'>('ALL');

    const { data: inspections, isLoading } = useQuery<UnifiedInspection[]>({
        queryKey: ['safety-inspections', mcContext],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/safety/inspections'));
            if (!res.ok) throw new Error('Failed to fetch inspections');
            return res.json();
        }
    });

    const filtered = inspections?.filter(i => {
        const matchesSearch =
            i.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.type.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterType === 'ALL' || i.source === filterType;

        return matchesSearch && matchesFilter;
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Inspections Log</CardTitle>
                        <CardDescription>Unified view of DOT Roadmap and Internal Maintenance inspections</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-[200px]"
                            />
                        </div>
                        <div className="flex bg-muted rounded-lg p-1">
                            <Button
                                variant={filterType === 'ALL' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterType('ALL')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterType === 'DOT' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterType('DOT')}
                                className="gap-1"
                            >
                                <Shield className="h-3 w-3" /> DOT
                            </Button>
                            <Button
                                variant={filterType === 'INTERNAL' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterType('INTERNAL')}
                                className="gap-1"
                            >
                                <Truck className="h-3 w-3" /> Internal
                            </Button>
                        </div>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Advanced
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Driver</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        Loading inspections...
                                    </TableCell>
                                </TableRow>
                            ) : filtered?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No inspections found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered?.map((inspection) => (
                                    <TableRow key={inspection.id}>
                                        <TableCell>
                                            {formatDate(inspection.date)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {inspection.type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {inspection.vehicle}
                                        </TableCell>
                                        <TableCell>
                                            {inspection.driver}
                                        </TableCell>
                                        <TableCell>
                                            {inspection.location}
                                        </TableCell>
                                        <TableCell>
                                            <ResultBadge result={inspection.result} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
