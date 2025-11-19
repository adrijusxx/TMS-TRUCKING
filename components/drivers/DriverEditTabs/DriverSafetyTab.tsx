'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverSafetyTabProps {
  driver: any;
}

export default function DriverSafetyTab({ driver }: DriverSafetyTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety</CardTitle>
        <CardDescription>Safety records and compliance</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Safety information coming soon...</p>
      </CardContent>
    </Card>
  );
}

