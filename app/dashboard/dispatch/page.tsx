'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import DispatchBoard from '@/components/dispatch/DispatchBoard';
import WeeklyScheduleView from '@/components/dispatch/WeeklyScheduleView';
import LoadCalendar from '@/components/calendar/LoadCalendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function DispatchPage() {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <>
      <Breadcrumb items={[{ label: 'Dispatch', href: '/dashboard/dispatch' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dispatch</h1>
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
    </>
  );
}

