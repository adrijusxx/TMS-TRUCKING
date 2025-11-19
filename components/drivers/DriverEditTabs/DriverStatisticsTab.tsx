'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverStatisticsTabProps {
  driver: any;
}

export default function DriverStatisticsTab({ driver }: DriverStatisticsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>Performance statistics and metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Statistics coming soon...</p>
      </CardContent>
    </Card>
  );
}

