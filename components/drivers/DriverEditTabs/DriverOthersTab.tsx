'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverOthersTabProps {
  driver: any;
}

export default function DriverOthersTab({ driver }: DriverOthersTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Others</CardTitle>
        <CardDescription>Additional information and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Other settings coming soon...</p>
      </CardContent>
    </Card>
  );
}

