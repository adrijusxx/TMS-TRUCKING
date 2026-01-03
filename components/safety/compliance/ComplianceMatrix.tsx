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
    FileDown,
    Search,
    Filter
} from 'lucide-react';
import { useState } from 'react';
import { apiUrl, formatDate } from '@/lib/utils';
import { getMcContext } from '@/lib/utils/query-keys';
import ComplianceEditSheet from './ComplianceEditSheet';
import { Edit } from 'lucide-react';

interface ComplianceDriver {
    id: string;
    name: string;
    driverNumber: string;
    cdl: {
        number: string; // Unused in display but good to have
        state: string;
        expiry: string; // ISO date
    } | null;
    medCard: {
        expiry: string; // ISO date
    } | null;
    mvr: {
        date: string;
        status: string;
    } | null;
    drugTest: {
        date: string;
        result: string;
    } | null;
    annualReview: {
        date: string;
        status: string;
    } | null;
    dqf: {
        status: string;
        lastAudited: string | null;
    } | null;
}

// Helper to determine status color and icon
const getStatus = (dateStr?: string, type?: 'expiry' | 'check') => {
    if (!dateStr) return { color: 'text-muted-foreground', icon: AlertCircle, bg: 'bg-muted' };

    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (type === 'expiry') {
        if (diffDays < 0) return { color: 'text-red-500', icon: AlertCircle, bg: 'bg-red-100 dark:bg-red-900/30' }; // Expired
        if (diffDays < 30) return { color: 'text-orange-500', icon: AlertTriangle, bg: 'bg-orange-100 dark:bg-orange-900/30' }; // Expiring soon
        return { color: 'text-green-500', icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30' }; // OK
    } else {
        // For 'check' (like Drug Test date), logic might differ (e.g. valid for 1 year)
        // Assuming 1 year validity for most annual things
        const ageDays = -diffDays; // Positive days since check
        if (ageDays > 365) return { color: 'text-red-500', icon: AlertCircle, bg: 'bg-red-100 dark:bg-red-900/30' }; // Overdue
        if (ageDays > 335) return { color: 'text-orange-500', icon: AlertTriangle, bg: 'bg-orange-100 dark:bg-orange-900/30' }; // Due soon
        return { color: 'text-green-500', icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30' };
    }
};

function StatusCell({ date, type, label }: { date?: string, type: 'expiry' | 'check', label?: string }) {
    const { color, icon: Icon, bg } = getStatus(date, type);

    return (
        <div className={`flex items-center gap-2 p-2 rounded-md ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
            <div className="flex flex-col">
                <span className="text-xs font-medium">{date ? formatDate(date) : 'Missing'}</span>
                {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
            </div>
        </div>
    );
}

export default function ComplianceMatrix() {
    const mcContext = getMcContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<ComplianceDriver | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data: drivers, isLoading } = useQuery<ComplianceDriver[]>({
        queryKey: ['compliance-matrix', mcContext],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/safety/compliance-matrix'));
            if (!res.ok) throw new Error('Failed to fetch compliance data');
            return res.json();
        }
    });

    const filteredDrivers = drivers?.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.driverNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (driver: ComplianceDriver) => {
        setSelectedDriver(driver);
        setIsSheetOpen(true);
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search drivers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-[250px]"
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                        <Button variant="outline">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Driver</TableHead>
                                <TableHead>CDL</TableHead>
                                <TableHead>Med Card</TableHead>
                                <TableHead>MVR</TableHead>
                                <TableHead>Drug Test</TableHead>
                                <TableHead>Annual Review</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        Loading compliance data...
                                    </TableCell>
                                </TableRow>
                            ) : filteredDrivers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No drivers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDrivers?.map((driver) => (
                                    <TableRow key={driver.id}>
                                        <TableCell>
                                            <div className="font-medium cursor-pointer hover:underline" onClick={() => handleEdit(driver)}>
                                                {driver.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusCell date={driver.cdl?.expiry} type="expiry" label={driver.cdl?.state} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusCell date={driver.medCard?.expiry} type="expiry" />
                                        </TableCell>
                                        <TableCell>
                                            <StatusCell date={driver.mvr?.date} type="check" label={driver.mvr?.status} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusCell date={driver.drugTest?.date} type="check" label={driver.drugTest?.result} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusCell date={driver.annualReview?.date} type="check" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(driver)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <ComplianceEditSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                driver={selectedDriver}
            />
        </Card>
    );
}
