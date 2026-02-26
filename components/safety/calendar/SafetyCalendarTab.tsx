'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import ExpirationCalendar from './ExpirationCalendar';

export default function SafetyCalendarTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Expiration Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpirationCalendar />
        </CardContent>
      </Card>
    </div>
  );
}
