'use client';

import { useState } from 'react';
import DispatchBoard from '@/components/dispatch/DispatchBoard';
import WeeklyScheduleView from '@/components/dispatch/WeeklyScheduleView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function DispatchPage() {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="board">Dispatch Board</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <WeeklyScheduleView />
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <DispatchBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

