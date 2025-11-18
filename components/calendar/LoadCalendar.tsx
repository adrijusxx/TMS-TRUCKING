'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Package, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
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
  customer: {
    name: string;
  };
}

async function fetchLoads(date: Date) {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  const response = await fetch(
    `/api/loads?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`
  );
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    LOADED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export default function LoadCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-loads', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: () => fetchLoads(currentDate),
  });

  const loads: Load[] = data?.data || [];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getLoadsForDate = (date: Date | null) => {
    if (!date) return [];
    return loads.filter((load) => {
      const pickupDate = new Date(load.pickupDate);
      const deliveryDate = load.deliveryDate ? new Date(load.deliveryDate) : null;
      
      return (
        (pickupDate.toDateString() === date.toDateString()) ||
        (deliveryDate && deliveryDate.toDateString() === date.toDateString())
      );
    });
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Planning Calendar</h1>
          <p className="text-muted-foreground">View and manage loads on a calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/loads/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Load
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{monthName}</h2>
              </div>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <Select value={view} onValueChange={(value: 'month' | 'week') => setView(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading calendar...</div>
            </div>
          ) : (
            <div className="border rounded-lg">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center font-medium border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {days.map((date, index) => {
                  const dayLoads = getLoadsForDate(date);
                  const isToday = date && date.toDateString() === new Date().toDateString();
                  const isOtherMonth = !date;
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] border-r border-b last:border-r-0 p-2 ${
                        isOtherMonth ? 'bg-muted/30' : ''
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1 max-h-[90px] overflow-y-auto">
                            {dayLoads.slice(0, 3).map((load) => (
                              <Link
                                key={load.id}
                                href={`/dashboard/loads/${load.id}`}
                                className="block"
                              >
                                <Badge
                                  variant="outline"
                                  className={`w-full text-xs justify-start ${getStatusColor(load.status)}`}
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  {load.loadNumber}
                                </Badge>
                              </Link>
                            ))}
                            {dayLoads.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayLoads.length - 3} more
                              </div>
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
        </CardContent>
      </Card>
    </div>
  );
}

