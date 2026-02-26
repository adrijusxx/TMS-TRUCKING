'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPast, isToday, format } from 'date-fns';
import LeadSheet from './LeadSheet';

interface FollowUpLead {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
    priority: string;
    nextFollowUpDate: string;
    nextFollowUpNote: string | null;
    assignedTo?: { firstName: string; lastName: string } | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const priorityDot: Record<string, string> = {
    HOT: 'bg-red-500',
    WARM: 'bg-amber-500',
    COLD: 'bg-blue-400',
};

export default function FollowUpCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['follow-up-calendar', monthKey],
        queryFn: async () => {
            const res = await fetch(`/api/crm/leads/follow-ups?month=${monthKey}`);
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    const leads: FollowUpLead[] = data?.leads || [];

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: Array<{ date: number | null; leads: FollowUpLead[] }> = [];

        // Leading empty slots
        for (let i = 0; i < firstDay; i++) days.push({ date: null, leads: [] });

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayLeads = leads.filter((l) => l.nextFollowUpDate.startsWith(dateStr));
            days.push({ date: d, leads: dayLeads });
        }

        return days;
    }, [currentMonth, leads]);

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const goToday = () => setCurrentMonth(new Date());

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5" />
                            Follow-Up Calendar
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8" onClick={goToday}>
                                Today
                            </Button>
                            <span className="text-sm font-medium min-w-[120px] text-center">
                                {format(currentMonth, 'MMMM yyyy')}
                            </span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
                            {DAYS.map((d) => (
                                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground bg-background">
                                    {d}
                                </div>
                            ))}
                            {calendarDays.map((day, i) => {
                                const today = day.date !== null && isToday(
                                    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day.date)
                                );
                                const past = day.date !== null && isPast(
                                    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day.date + 1)
                                );
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'min-h-[80px] p-1 bg-background',
                                            day.date === null && 'bg-muted/30',
                                            today && 'ring-2 ring-primary ring-inset',
                                        )}
                                    >
                                        {day.date !== null && (
                                            <>
                                                <span className={cn(
                                                    'text-xs font-medium',
                                                    today && 'text-primary font-bold',
                                                    past && day.leads.length > 0 && 'text-red-500',
                                                )}>
                                                    {day.date}
                                                </span>
                                                <div className="space-y-0.5 mt-0.5">
                                                    {day.leads.slice(0, 3).map((lead) => (
                                                        <button
                                                            key={lead.id}
                                                            className={cn(
                                                                'w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate',
                                                                'hover:bg-muted/80 transition-colors',
                                                                past ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400' : 'bg-muted/50',
                                                            )}
                                                            onClick={() => { setSelectedLeadId(lead.id); setSheetOpen(true); }}
                                                        >
                                                            <span className={cn('inline-block h-1.5 w-1.5 rounded-full mr-0.5', priorityDot[lead.priority] || 'bg-gray-400')} />
                                                            {lead.firstName} {lead.lastName[0]}.
                                                        </button>
                                                    ))}
                                                    {day.leads.length > 3 && (
                                                        <span className="text-[10px] text-muted-foreground px-1">
                                                            +{day.leads.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {leads.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            {leads.length} follow-up{leads.length !== 1 ? 's' : ''} this month
                        </p>
                    )}
                </CardContent>
            </Card>

            <LeadSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                leadId={selectedLeadId}
                onSuccess={() => { refetch(); setSheetOpen(false); }}
            />
        </>
    );
}
