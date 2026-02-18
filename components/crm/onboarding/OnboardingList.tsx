'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import OnboardingProgressBar from './OnboardingProgressBar';
import OnboardingDetail from './OnboardingDetail';

const statusColors: Record<string, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OnboardingList() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['onboarding-list', statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const res = await fetch(`/api/crm/onboarding?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const checklists = data?.checklists || [];

    const handleRowClick = (id: string) => {
        setSelectedId(id);
        setDetailOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : checklists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-lg font-medium">No onboarding checklists</p>
                    <p className="text-sm mt-1">Hire a lead to automatically create an onboarding checklist.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Driver</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Steps</TableHead>
                            <TableHead>Started</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {checklists.map((c: any) => {
                            const name = c.driver?.user
                                ? `${c.driver.user.firstName} ${c.driver.user.lastName}`
                                : c.lead
                                    ? `${c.lead.firstName} ${c.lead.lastName}`
                                    : 'Unknown';

                            return (
                                <TableRow
                                    key={c.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(c.id)}
                                >
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {c.driver?.driverNumber}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[c.status] || ''}>
                                            {c.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <OnboardingProgressBar progress={c.progress} size="sm" />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {c.progress}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {c.completedSteps}/{c.totalSteps}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {c.startedAt
                                                ? formatDistanceToNow(new Date(c.startedAt), { addSuffix: true })
                                                : 'Not started'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            <OnboardingDetail
                open={detailOpen}
                onOpenChange={setDetailOpen}
                checklistId={selectedId}
            />
        </div>
    );
}
