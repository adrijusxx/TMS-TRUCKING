'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar, Send, MapPin, Wrench, CheckCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import BreakdownCommunicationLog from '../BreakdownCommunicationLog';

interface BreakdownTimelineTabProps {
  breakdown: any;
  breakdownId: string;
}

interface TimelineEvent {
  key: string;
  date: string | null;
  icon: React.ReactNode;
  label: string;
  extra?: React.ReactNode;
  isLast?: boolean;
}

export default function BreakdownTimelineTab({ breakdown, breakdownId }: BreakdownTimelineTabProps) {
  const events: TimelineEvent[] = [
    {
      key: 'reported',
      date: breakdown.reportedAt,
      icon: <Calendar className="h-4 w-4 text-white" />,
      label: 'Reported',
    },
    {
      key: 'dispatched',
      date: breakdown.dispatchedAt,
      icon: <Send className="h-4 w-4 text-white" />,
      label: 'Dispatched',
      extra: breakdown.serviceProvider ? (
        <div className="text-sm mt-1">Vendor: {breakdown.serviceProvider}</div>
      ) : undefined,
    },
    {
      key: 'arrived',
      date: breakdown.arrivedAt,
      icon: <MapPin className="h-4 w-4 text-white" />,
      label: 'Service Arrived',
    },
    {
      key: 'repairStarted',
      date: breakdown.repairStartedAt,
      icon: <Wrench className="h-4 w-4 text-white" />,
      label: 'Repair Started',
    },
    {
      key: 'repairCompleted',
      date: breakdown.repairCompletedAt,
      icon: <CheckCircle className="h-4 w-4 text-white" />,
      label: 'Repair Completed',
    },
    {
      key: 'truckReady',
      date: breakdown.truckReadyAt,
      icon: <CheckCircle className="h-4 w-4 text-white" />,
      label: 'Truck Ready',
      isLast: true,
    },
  ];

  const activeEvents = events.filter((e) => e.date);
  const iconColors: Record<string, string> = {
    reported: 'bg-blue-500',
    dispatched: 'bg-green-500',
    arrived: 'bg-orange-500',
    repairStarted: 'bg-purple-500',
    repairCompleted: 'bg-green-500',
    truckReady: 'bg-green-600',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Breakdown Timeline</CardTitle>
          <CardDescription>Key events and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeEvents.map((event, idx) => {
              const isLast = event.isLast || idx === activeEvents.length - 1;
              return (
                <div key={event.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full ${iconColors[event.key] || 'bg-gray-500'} p-2`}>
                      {event.icon}
                    </div>
                    {!isLast && <div className="w-px h-full bg-border mt-2" />}
                  </div>
                  <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
                    <div className="font-semibold">{event.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(event.date!)}
                    </div>
                    {event.extra}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <BreakdownCommunicationLog breakdownId={breakdownId} />
    </div>
  );
}
