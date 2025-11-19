'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverMobileAppTabProps {
  driver: any;
}

export default function DriverMobileAppTab({ driver }: DriverMobileAppTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile App Login</CardTitle>
        <CardDescription>Configure mobile app access for driver</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Mobile app login configuration coming soon...</p>
      </CardContent>
    </Card>
  );
}

