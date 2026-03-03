'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertTriangle, Wrench, ShieldAlert, MapPin, Truck, Clock,
    Loader2, RefreshCw, ChevronRight, Phone, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/utils';
import TelegramCaseDetail from './TelegramCaseDetail';

interface ActiveCase {
    id: string;
    caseType: 'breakdown' | 'safety' | 'maintenance';
    caseNumber: string;
    status: string;
    priority: string;
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    reportedAt: string;
    driverName: string;
    driverPhone?: string;
    truckNumber: string;
    truckId?: string;
    samsaraId?: string;
    samsaraLocation?: { latitude: number; longitude: number; address: string } | null;
}

const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
};

const TYPE_CONFIG = {
    breakdown: { icon: AlertTriangle, label: 'Breakdown', color: 'text-red-500', bg: 'bg-red-500/10' },
    safety: { icon: ShieldAlert, label: 'Safety', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    maintenance: { icon: Wrench, label: 'Maintenance', color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

async function fetchActiveCases(): Promise<ActiveCase[]> {
    // Fetch breakdowns, safety incidents, and maintenance in parallel
    const [breakdownRes, safetyRes, maintenanceRes] = await Promise.all([
        fetch(apiUrl('/api/fleet/breakdowns/active')).then(r => r.ok ? r.json() : { data: { breakdowns: [] } }),
        fetch(apiUrl('/api/safety/incidents?status=REPORTED&limit=50')).then(r => r.ok ? r.json() : { incidents: [] }),
        fetch(apiUrl('/api/maintenance?limit=50')).then(r => r.ok ? r.json() : { data: { records: [] } }),
    ]);

    const cases: ActiveCase[] = [];

    for (const b of breakdownRes?.data?.breakdowns || []) {
        cases.push({
            id: b.id,
            caseType: 'breakdown',
            caseNumber: b.breakdownNumber,
            status: b.status,
            priority: b.priority,
            description: b.problem || b.description || '',
            location: b.location,
            latitude: b.latitude,
            longitude: b.longitude,
            reportedAt: b.reportedAt || b.createdAt,
            driverName: b.driver ? `${b.driver.user?.firstName || ''} ${b.driver.user?.lastName || ''}`.trim() : 'Unknown',
            driverPhone: b.driver?.user?.phone,
            truckNumber: b.truck?.truckNumber || 'N/A',
            truckId: b.truck?.id,
            samsaraId: b.truck?.samsaraId,
        });
    }

    for (const s of safetyRes?.incidents || []) {
        if (s.status === 'RESOLVED' || s.status === 'CLOSED') continue;
        cases.push({
            id: s.id,
            caseType: 'safety',
            caseNumber: s.incidentNumber,
            status: s.status,
            priority: s.severity === 'MAJOR' ? 'HIGH' : s.severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
            description: s.description || '',
            location: s.location,
            latitude: s.latitude,
            longitude: s.longitude,
            reportedAt: s.date || s.createdAt,
            driverName: s.driver ? `${s.driver.user?.firstName || ''} ${s.driver.user?.lastName || ''}`.trim() : 'Unknown',
            driverPhone: s.driver?.user?.phone,
            truckNumber: s.truck?.truckNumber || 'N/A',
            truckId: s.truck?.id,
            samsaraId: s.truck?.samsaraId,
        });
    }

    for (const m of maintenanceRes?.data?.records || []) {
        if (m.status !== 'OPEN' && m.status !== 'IN_PROGRESS') continue;
        cases.push({
            id: m.id,
            caseType: 'maintenance',
            caseNumber: m.maintenanceNumber || m.id.slice(0, 8),
            status: m.status,
            priority: 'MEDIUM',
            description: m.description || '',
            location: undefined,
            reportedAt: m.date || m.createdAt,
            driverName: 'N/A',
            truckNumber: m.truck?.truckNumber || 'N/A',
            truckId: m.truck?.id,
            samsaraId: m.truck?.samsaraId,
        });
    }

    // Sort by priority then date
    const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    cases.sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

    return cases;
}

export default function TelegramActiveCases() {
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [selectedCase, setSelectedCase] = useState<ActiveCase | null>(null);

    const { data: cases, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['telegram-active-cases'],
        queryFn: fetchActiveCases,
        refetchInterval: 60000,
    });

    const filtered = (cases || []).filter(c => typeFilter === 'all' || c.caseType === typeFilter);
    const counts = {
        all: cases?.length || 0,
        breakdown: cases?.filter(c => c.caseType === 'breakdown').length || 0,
        safety: cases?.filter(c => c.caseType === 'safety').length || 0,
        maintenance: cases?.filter(c => c.caseType === 'maintenance').length || 0,
    };

    if (selectedCase) {
        return (
            <TelegramCaseDetail
                caseData={selectedCase}
                onBack={() => setSelectedCase(null)}
            />
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5" />
                        Active Cases
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
                <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                    <TabsList className="h-8">
                        <TabsTrigger value="all" className="text-xs gap-1">
                            All {counts.all > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{counts.all}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="breakdown" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> Breakdowns
                            {counts.breakdown > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{counts.breakdown}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="safety" className="text-xs gap-1">
                            <ShieldAlert className="h-3 w-3" /> Safety
                            {counts.safety > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{counts.safety}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="text-xs gap-1">
                            <Wrench className="h-3 w-3" /> Maintenance
                            {counts.maintenance > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{counts.maintenance}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[550px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No active cases</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filtered.map(c => (
                                <CaseRow key={c.id} caseData={c} onClick={() => setSelectedCase(c)} />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function CaseRow({ caseData: c, onClick }: { caseData: ActiveCase; onClick: () => void }) {
    const typeConf = TYPE_CONFIG[c.caseType];
    const TypeIcon = typeConf.icon;
    const priorityClass = PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.MEDIUM;

    return (
        <button onClick={onClick} className="w-full p-4 text-left hover:bg-muted/30 transition-colors group">
            <div className="flex items-start justify-between gap-3">
                {/* Left */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg ${typeConf.bg} shrink-0`}>
                        <TypeIcon className={`h-4 w-4 ${typeConf.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-semibold">{c.caseNumber}</span>
                            <Badge className={`text-[10px] border ${priorityClass}`}>{c.priority}</Badge>
                            <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">{c.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {c.truckNumber}
                            </span>
                            <span>{c.driverName}</span>
                            {c.driverPhone && (
                                <a href={`tel:${c.driverPhone}`} className="flex items-center gap-0.5 hover:text-primary" onClick={e => e.stopPropagation()}>
                                    <Phone className="h-2.5 w-2.5" />
                                    {c.driverPhone}
                                </a>
                            )}
                            {c.location && (
                                <span className="flex items-center gap-1 max-w-[200px] truncate">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    {c.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(c.reportedAt), { addSuffix: true })}
                        </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </button>
    );
}
