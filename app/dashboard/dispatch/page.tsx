'use client';

import { useState } from 'react';
import DispatchBoard from '@/components/dispatch/DispatchBoard';
import WeeklyScheduleView from '@/components/dispatch/WeeklyScheduleView';
import LoadCalendar from '@/components/calendar/LoadCalendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function DispatchPage() {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Dispatch</h1>
        <p className="text-muted-foreground">
          Manage load assignments, scheduling, and planning
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="board">Dispatch Board</TabsTrigger>
          <TabsTrigger value="calendar">Planning Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <WeeklyScheduleView />
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <DispatchBoard />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <LoadCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}

