'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileWarning } from 'lucide-react';
import Link from 'next/link';

interface OpenViolationsTileProps {
  count: number;
}

export default function OpenViolationsTile({ count }: OpenViolationsTileProps) {
  const getColor = () => {
    if (count === 0) return 'text-green-600 dark:text-green-400';
    if (count <= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Link href="/dashboard/safety/compliance/roadside-inspections">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Violations</CardTitle>
          <FileWarning className={`h-4 w-4 ${getColor()}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getColor()}`}>{count}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {count === 0 ? 'No open violations' : 'Violations requiring attention'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

