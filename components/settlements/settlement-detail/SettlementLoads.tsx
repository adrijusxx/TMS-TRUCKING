'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package } from 'lucide-react';

interface SettlementLoadsProps {
  loads: any[];
}

export default function SettlementLoads({ loads }: SettlementLoadsProps) {
  if (!loads || loads.length === 0) return null;

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Loads Included ({loads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load #</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Driver Pay</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead>Pickup Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loads.map((load: any) => (
                <TableRow key={load.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/loads/${load.id}`} className="text-primary hover:underline">
                      {load.loadNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {load.pickupCity}, {load.pickupState} &rarr; {load.deliveryCity}, {load.deliveryState}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(load.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(load.driverPay || 0)}</TableCell>
                  <TableCell className="text-right">
                    {(load.route?.totalDistance || load.totalMiles || 0) ? `${(load.route?.totalDistance || load.totalMiles || 0)} mi` : 'N/A'}
                  </TableCell>
                  <TableCell>{load.pickupDate ? formatDate(load.pickupDate) : 'N/A'}</TableCell>
                  <TableCell>{load.deliveryDate ? formatDate(load.deliveryDate) : 'N/A'}</TableCell>
                  <TableCell>{load.deliveredAt ? formatDate(load.deliveredAt) : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/loads/${load.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
