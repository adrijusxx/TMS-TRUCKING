'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Load {
  id: string;
  loadNumber: string;
  status: string;
  pickupDate: Date;
  deliveryDate?: Date | null;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  customer: { name: string };
}

async function fetchLoads(date: Date) {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const response = await fetch(`/api/loads?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`);
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  LOADED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800',
};

export default function LoadCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-loads', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => fetchLoads(currentDate),
  });

  const loads: Load[] = data?.data || [];

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getLoadsForDate = (date: Date | null) => {
    if (!date) return [];
    return loads.filter((load) => {
      if (!load.pickupDate) return false;
      const pickupDate = new Date(load.pickupDate);
      const deliveryDate = load.deliveryDate ? new Date(load.deliveryDate) : null;
      return pickupDate.toDateString() === date.toDateString() ||
        (deliveryDate && deliveryDate.toDateString() === date.toDateString());
    });
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium min-w-[90px] text-center">{monthName}</span>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={goToNextMonth}>
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={goToToday}>Today</Button>
        </div>
        <div className="flex items-center gap-1">
          <Select value={view} onValueChange={(v: 'month' | 'week') => setView(v)}>
            <SelectTrigger className="h-6 text-xs w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month" className="text-xs">Month</SelectItem>
              <SelectItem value="week" className="text-xs">Week</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/dashboard/loads/new">
            <Button size="sm" className="h-6 text-xs px-2">
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 bg-muted/50 border-b">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="py-1 text-center text-[10px] font-medium border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const dayLoads = getLoadsForDate(date);
              const isToday = date && date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[70px] border-r border-b last:border-r-0 p-1 ${
                    !date ? 'bg-muted/30' : ''
                  } ${isToday ? 'bg-primary/5' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-[10px] font-medium ${isToday ? 'text-primary' : ''}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5 max-h-[50px] overflow-y-auto">
                        {dayLoads.slice(0, 3).map((load) => (
                          <Link key={load.id} href={`/dashboard/loads/${load.id}`}>
                            <Badge
                              variant="outline"
                              className={`w-full text-[8px] h-4 justify-start px-1 ${STATUS_COLORS[load.status] || 'bg-gray-100'}`}
                            >
                              <Package className="h-2 w-2 mr-0.5 flex-shrink-0" />
                              <span className="truncate">{load.loadNumber}</span>
                            </Badge>
                          </Link>
                        ))}
                        {dayLoads.length > 3 && (
                          <div className="text-[8px] text-muted-foreground">+{dayLoads.length - 3}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
