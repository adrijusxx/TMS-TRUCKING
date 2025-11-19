'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverTasksTabProps {
  driver: any;
}

export default function DriverTasksTab({ driver }: DriverTasksTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>Assigned tasks and to-dos</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Tasks coming soon...</p>
      </CardContent>
    </Card>
  );
}

