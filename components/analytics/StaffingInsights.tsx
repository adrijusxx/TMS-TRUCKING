'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Users, UserPlus, UserMinus, ShieldCheck, Calculator,
    HardHat, ChevronRight, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';

interface StaffRec {
    role: string;
    current: number;
    recommended: number;
    status: 'ok' | 'understaffed' | 'overstaffed';
    note: string;
}

interface StaffingInsightsProps {
    staffing: StaffRec[];
    totalTrucks: number;
    totalDrivers: number;
    totalUsers: number;
}

const ROLE_ICONS: Record<string, any> = {
    'Dispatchers': Users,
    'Safety Managers': ShieldCheck,
    'Accounting Staff': Calculator,
    'HR Staff': UserPlus,
    'Fleet Managers': HardHat,
    'Admin / Owner': Users,
};

function StatusBadge({ status }: { status: StaffRec['status'] }) {
    const config = {
        ok: { label: 'Staffed', bg: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
        understaffed: { label: 'Understaffed', bg: 'bg-red-500/10 text-red-600 border-red-500/20', icon: UserMinus },
        overstaffed: { label: 'Overstaffed', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Info },
    }[status];

    const Icon = config.icon;
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', config.bg)}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}

export default function StaffingInsights({ staffing, totalTrucks, totalDrivers, totalUsers }: StaffingInsightsProps) {
    const understaffedCount = staffing.filter(s => s.status === 'understaffed').length;
    const totalRecommended = staffing.reduce((sum, s) => sum + s.recommended, 0);
    const totalCurrent = staffing.reduce((sum, s) => sum + s.current, 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Staffing Analysis & Recommendations
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Industry-standard ratios for carrier operations • {totalTrucks} trucks • {totalDrivers} drivers • {totalUsers} total users
                        </CardDescription>
                    </div>
                    {understaffedCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-600">{understaffedCount} role{understaffedCount > 1 ? 's' : ''} understaffed</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary Bar */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{totalUsers}</p>
                        <p className="text-xs text-muted-foreground">Current Staff</p>
                    </div>
                    <div className="text-center border-x border-border">
                        <p className="text-2xl font-bold">{totalRecommended}</p>
                        <p className="text-xs text-muted-foreground">Recommended (Ops)</p>
                    </div>
                    <div className="text-center">
                        <p className={cn("text-2xl font-bold", totalCurrent >= totalRecommended ? "text-green-600" : "text-red-600")}>
                            {totalCurrent >= totalRecommended ? '+' : ''}{totalCurrent - totalRecommended}
                        </p>
                        <p className="text-xs text-muted-foreground">Difference</p>
                    </div>
                </div>

                {/* Role Cards */}
                <div className="space-y-3">
                    {staffing.map((rec) => {
                        const Icon = ROLE_ICONS[rec.role] || Users;
                        const fillPercent = rec.recommended > 0 ? Math.min((rec.current / rec.recommended) * 100, 150) : 0;
                        const barColor = rec.status === 'ok' ? 'bg-green-500' : rec.status === 'understaffed' ? 'bg-red-500' : 'bg-amber-500';

                        return (
                            <div key={rec.role} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{rec.role}</span>
                                            <StatusBadge status={rec.status} />
                                        </div>
                                        <span className="text-sm font-bold">
                                            {rec.current} / {rec.recommended}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
                                        <div className={cn(barColor, 'h-1.5 rounded-full transition-all')} style={{ width: `${Math.min(fillPercent, 100)}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{rec.note}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Tip */}
                <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">💡 Staffing Tip:</strong> These ratios are based on FMCSA carrier industry averages.
                        Actual needs vary based on operational complexity, technology automation, and geographic spread.
                        Companies using advanced TMS/ELD integrations can typically operate with 15-20% fewer dispatchers and safety staff.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
