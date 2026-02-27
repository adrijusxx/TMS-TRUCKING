'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiUrl, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  type: string;
  label: string;
  driverName?: string;
  driverId?: string;
  expirationDate: string;
  urgency: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'UPCOMING';
}

const urgencyColors: Record<string, string> = {
  EXPIRED: 'bg-red-500',
  CRITICAL: 'bg-orange-500',
  WARNING: 'bg-yellow-500',
  UPCOMING: 'bg-green-500',
};

const urgencyBadgeColors: Record<string, string> = {
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  CRITICAL: 'bg-orange-100 text-orange-800 border-orange-200',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UPCOMING: 'bg-green-100 text-green-800 border-green-200',
};

const typeFilters = [
  { value: 'ALL', label: 'All Types' },
  { value: 'MEDICAL_CARD', label: 'Medical Cards' },
  { value: 'CDL', label: 'CDL' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'INSURANCE', label: 'Insurance' },
];

export default function ExpirationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 2, 0).toISOString().split('T')[0];

  const { data: events } = useQuery({
    queryKey: ['expiration-calendar', startDate, endDate, filterType],
    queryFn: async () => {
      let url = `/api/safety/expirations/calendar?startDate=${startDate}&endDate=${endDate}`;
      if (filterType && filterType !== 'ALL') url += `&type=${filterType}`;
      const res = await fetch(apiUrl(url));
      if (!res.ok) throw new Error('Failed to fetch expirations');
      const json = await res.json();
      return json.data as CalendarEvent[];
    },
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events ?? []) {
      const day = new Date(event.expirationDate).toISOString().split('T')[0];
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(event);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

    // Padding for previous month
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const date = new Date(year, month - 1, d).toISOString().split('T')[0];
      days.push({ date, day: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d).toISOString().split('T')[0];
      days.push({ date, day: d, isCurrentMonth: true });
    }

    // Padding for next month
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d).toISOString().split('T')[0];
      days.push({ date, day: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold w-[200px] text-center">{monthLabel}</h3>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {typeFilters.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Expired</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500" /> &lt;7 days</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> &lt;30 days</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> &lt;90 days</div>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, day, isCurrentMonth }) => {
            const dayEvents = eventsByDay.get(date) ?? [];
            const isSelected = selectedDay === date;
            return (
              <div
                key={date}
                onClick={() => setSelectedDay(isSelected ? null : date)}
                className={`min-h-[80px] p-1 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors ${
                  !isCurrentMonth ? 'bg-muted/20' : ''
                } ${isSelected ? 'bg-muted' : ''}`}
              >
                <div className={`text-sm ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                  {day}
                </div>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={`w-2 h-2 rounded-full ${urgencyColors[e.urgency]}`}
                      title={`${e.label} - ${e.driverName ?? ''}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-muted-foreground">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && selectedDayEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Expirations on {formatDate(selectedDay)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedDayEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${urgencyColors[e.urgency]}`} />
                    <span>{e.label}</span>
                    {e.driverName && (
                      <span className="text-muted-foreground">- {e.driverName}</span>
                    )}
                  </div>
                  <Badge variant="outline" className={urgencyBadgeColors[e.urgency]}>
                    {e.urgency}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
