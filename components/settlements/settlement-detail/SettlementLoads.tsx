'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';

interface SettlementLoadsProps {
  loads: any[];
  hideRevenue?: boolean;
  onAddCharges?: () => void;
  onAddTrips?: () => void;
  onDeleteLoads?: (loadIds: string[]) => void;
  isDeleting?: boolean;
}

const ALL_COLUMNS = [
  { id: 'trip', label: 'Trip' },
  { id: 'loadId', label: 'Load ID' },
  { id: 'truck', label: 'Truck unit #' },
  { id: 'customer', label: 'Customer' },
  { id: 'totalPay', label: 'Total pay' },
  { id: 'driverGross', label: 'Driver gross' },
  { id: 'status', label: 'Status' },
  { id: 'deliveryDate', label: 'Delivery date' },
  { id: 'pickupDate', label: 'Pickup date' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'loadedMiles', label: 'Loaded miles' },
  { id: 'emptyMiles', label: 'Empty miles' },
  { id: 'totalMiles', label: 'Total miles' },
  { id: 'rate', label: 'Rate' },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]['id'];

const DEFAULT_VISIBLE = new Set<ColumnId>([
  'trip', 'loadId', 'truck', 'customer', 'totalPay', 'driverGross',
  'status', 'deliveryDate', 'pickupDate', 'pickup', 'delivery',
  'loadedMiles', 'emptyMiles', 'totalMiles', 'rate',
]);

export default function SettlementLoads({ loads, hideRevenue = false, onAddCharges, onAddTrips, onDeleteLoads, isDeleting }: SettlementLoadsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<ColumnId>>(DEFAULT_VISIBLE);

  if (!loads || loads.length === 0) return null;

  const totalLoadedMiles = loads.reduce((s, l) => s + (l.loadedMiles || 0), 0);
  const totalEmptyMiles = loads.reduce((s, l) => s + (l.emptyMiles || 0), 0);
  const totalMiles = loads.reduce((s, l) => s + (l.totalMiles || l.route?.totalDistance || 0), 0);
  const totalDriverPay = loads.reduce((s, l) => s + (l.driverPay || 0), 0);
  const totalRevenue = loads.reduce((s, l) => s + (l.revenue || 0), 0);

  const toggleAll = () => {
    if (selectedIds.size === loads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(loads.map((l: any) => l.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCol = (col: ColumnId) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const show = (col: ColumnId) => visibleCols.has(col);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Loads ({loads.length})</CardTitle>
          <div className="flex items-center gap-2">
            {onAddCharges && (
              <Button size="sm" variant="outline" onClick={onAddCharges}>
                <Plus className="h-4 w-4 mr-1" />Add charges
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onAddTrips} disabled={!onAddTrips}>
              <Plus className="h-4 w-4 mr-1" />Add trips
            </Button>
            <Button size="sm" variant="outline" disabled={selectedIds.size === 0 || !onDeleteLoads || isDeleting}
              onClick={() => {
                if (onDeleteLoads && selectedIds.size > 0 && confirm(`Remove ${selectedIds.size} load(s) from this settlement?`)) {
                  onDeleteLoads(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }
              }}>
              <Trash2 className="h-4 w-4 mr-1" />Delete
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><LayoutGrid className="h-4 w-4 mr-1" />Columns</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                {ALL_COLUMNS.map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={visibleCols.has(col.id)}
                    onCheckedChange={() => toggleCol(col.id)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><Checkbox checked={loads.length > 0 && selectedIds.size === loads.length} onCheckedChange={toggleAll} /></TableHead>
                {show('trip') && <TableHead>Trip</TableHead>}
                {show('loadId') && <TableHead>Load ID</TableHead>}
                {show('truck') && <TableHead>Truck unit #</TableHead>}
                {show('customer') && <TableHead>Customer</TableHead>}
                {show('totalPay') && <TableHead className="text-right">Total pay</TableHead>}
                {show('driverGross') && <TableHead className="text-right">Driver gross</TableHead>}
                {show('status') && <TableHead>Status</TableHead>}
                {show('deliveryDate') && <TableHead>Delivery date</TableHead>}
                {show('pickupDate') && <TableHead>Pickup date</TableHead>}
                {show('pickup') && <TableHead>Pickup</TableHead>}
                {show('delivery') && <TableHead>Delivery</TableHead>}
                {show('loadedMiles') && <TableHead className="text-right">Loaded miles</TableHead>}
                {show('emptyMiles') && <TableHead className="text-right">Empty miles</TableHead>}
                {show('totalMiles') && <TableHead className="text-right">Total miles</TableHead>}
                {show('rate') && <TableHead className="text-right">Rate</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loads.map((load: any) => {
                const miles = load.totalMiles || load.route?.totalDistance || 0;
                return (
                  <TableRow key={load.id} className="text-xs">
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(load.id)} onCheckedChange={() => toggleOne(load.id)} />
                    </TableCell>
                    {show('trip') && <TableCell>{load.tripId || '-'}</TableCell>}
                    {show('loadId') && (
                      <TableCell>
                        <Link href={`/dashboard/loads/${load.loadNumber || load.id}`} className="text-primary hover:underline font-medium">
                          {load.loadNumber}
                        </Link>
                      </TableCell>
                    )}
                    {show('truck') && <TableCell>{load.truck?.truckNumber || '-'}</TableCell>}
                    {show('customer') && <TableCell>{load.customer?.name || '-'}</TableCell>}
                    {show('totalPay') && <TableCell className="text-right">{formatCurrency(load.revenue || 0)}</TableCell>}
                    {show('driverGross') && <TableCell className="text-right">{formatCurrency(load.driverPay || 0)}</TableCell>}
                    {show('status') && (
                      <TableCell>
                        {load.status ? <Badge variant="outline" className="text-[10px]">{load.status}</Badge> : '-'}
                      </TableCell>
                    )}
                    {show('deliveryDate') && <TableCell className="whitespace-nowrap">{load.deliveryDate ? formatDate(load.deliveryDate) : '-'}</TableCell>}
                    {show('pickupDate') && <TableCell className="whitespace-nowrap">{load.pickupDate ? formatDate(load.pickupDate) : '-'}</TableCell>}
                    {show('pickup') && <TableCell className="whitespace-nowrap">{load.pickupCity}, {load.pickupState}</TableCell>}
                    {show('delivery') && <TableCell className="whitespace-nowrap">{load.deliveryCity}, {load.deliveryState}</TableCell>}
                    {show('loadedMiles') && <TableCell className="text-right">{load.loadedMiles?.toLocaleString() || '-'}</TableCell>}
                    {show('emptyMiles') && <TableCell className="text-right">{load.emptyMiles?.toLocaleString() || '-'}</TableCell>}
                    {show('totalMiles') && <TableCell className="text-right">{miles.toLocaleString()}</TableCell>}
                    {show('rate') && <TableCell className="text-right">{load.revenuePerMile ? load.revenuePerMile.toFixed(2) : '-'}</TableCell>}
                  </TableRow>
                );
              })}
              {/* Totals */}
              <TableRow className="bg-muted/50 font-semibold border-t-2 text-xs">
                <TableCell />
                {show('trip') && <TableCell>Total</TableCell>}
                {show('loadId') && <TableCell>-</TableCell>}
                {show('truck') && <TableCell />}
                {show('customer') && <TableCell />}
                {show('totalPay') && <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>}
                {show('driverGross') && <TableCell className="text-right">{formatCurrency(totalDriverPay)}</TableCell>}
                {show('status') && <TableCell>-</TableCell>}
                {show('deliveryDate') && <TableCell>-</TableCell>}
                {show('pickupDate') && <TableCell>-</TableCell>}
                {show('pickup') && <TableCell>-</TableCell>}
                {show('delivery') && <TableCell>-</TableCell>}
                {show('loadedMiles') && <TableCell className="text-right">{totalLoadedMiles.toLocaleString()}</TableCell>}
                {show('emptyMiles') && <TableCell className="text-right">{totalEmptyMiles.toLocaleString()}</TableCell>}
                {show('totalMiles') && <TableCell className="text-right">{totalMiles.toLocaleString()}</TableCell>}
                {show('rate') && <TableCell className="text-right">-</TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
