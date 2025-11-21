'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface DaysSinceAccidentTileProps {
  days: number | null;
}

export default function DaysSinceAccidentTile({ days }: DaysSinceAccidentTileProps) {
  const getColor = () => {
    if (days === null) return 'text-muted-foreground';
    if (days >= 365) return 'text-green-600 dark:text-green-400';
    if (days >= 180) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatus = () => {
    if (days === null) return 'No accident records';
    if (days >= 365) return 'Excellent safety record';
    if (days >= 180) return 'Good safety record';
    return 'Recent accident - review needed';
  };

  return (
    <Link href="/dashboard/safety/incidents">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Days Since Last Accident</CardTitle>
          {days !== null && days >= 365 ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Calendar className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getColor()}`}>
            {days !== null ? `${days} days` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getStatus()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

