'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverAssetsTabProps {
  driver: any;
}

export default function DriverAssetsTab({ driver }: DriverAssetsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assets</CardTitle>
        <CardDescription>Assigned assets and equipment</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Assets information coming soon...</p>
      </CardContent>
    </Card>
  );
}

