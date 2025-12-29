'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import Link from 'next/link';

interface ActiveVehiclesTileProps {
  count: number;
}

export default function ActiveVehiclesTile({ count }: ActiveVehiclesTileProps) {
  return (
    <Link href="/dashboard/trucks?status=AVAILABLE">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Vehicles in service
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

