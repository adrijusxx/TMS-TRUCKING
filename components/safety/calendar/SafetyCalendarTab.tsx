'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function SafetyCalendarTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Calendar view of safety events, inspections, court dates, and training schedules coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
