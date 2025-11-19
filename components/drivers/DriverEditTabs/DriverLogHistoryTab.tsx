'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverLogHistoryTabProps {
  driver: any;
}

export default function DriverLogHistoryTab({ driver }: DriverLogHistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log History</CardTitle>
        <CardDescription>Activity and change logs</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Log history coming soon...</p>
      </CardContent>
    </Card>
  );
}

