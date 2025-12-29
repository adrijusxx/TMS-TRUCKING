'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import Link from 'next/link';

interface ActiveDriversTileProps {
  count: number;
}

export default function ActiveDriversTile({ count }: ActiveDriversTileProps) {
  return (
    <Link href="/dashboard/drivers?status=AVAILABLE">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently available drivers
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

