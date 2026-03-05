'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { calculateLoadDriverPay } from './calculateLoadDriverPay';

interface LoadSelectionTableProps {
  availableLoads: any[];
  selectedLoads: Set<string>;
  selectedDriver: any;
  loadsLoading: boolean;
  totalRevenue: number;
  totalDriverPay: number;
  onToggleLoad: (loadId: string) => void;
  onSelectAll: () => void;
}

export default function LoadSelectionTable({
  availableLoads,
  selectedLoads,
  selectedDriver,
  loadsLoading,
  totalRevenue,
  totalDriverPay,
  onToggleLoad,
  onSelectAll,
}: LoadSelectionTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Load Selection</CardTitle>
            <CardDescription>Select completed loads to include in this settlement</CardDescription>
          </div>
          {availableLoads.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
              {selectedLoads.size === availableLoads.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loadsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading loads...</span>
          </div>
        ) : availableLoads.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Loads Available</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>No delivered loads found for this driver in the selected period.</p>
                <div className="bg-muted/50 p-2 rounded text-xs">
                  <p className="font-semibold mb-1">Troubleshooting Checklist:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Is the load status <strong>DELIVERED</strong>, <strong>INVOICED</strong>, or <strong>PAID</strong>?</li>
                    <li>Is the correct <strong>Driver</strong> assigned to the load?</li>
                    <li>Has the <strong>POD</strong> been uploaded? (Required for &quot;Ready for Settlement&quot; flag)</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLoads.size === availableLoads.length && availableLoads.length > 0}
                      onCheckedChange={onSelectAll}
                    />
                  </TableHead>
                  <TableHead>Load #</TableHead>
                  <TableHead className="w-8">Notes</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Driver Pay</TableHead>
                  <TableHead className="text-right">Miles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableLoads.map((load: any) => {
                  const pay = calculateLoadDriverPay(load, selectedDriver);
                  const isStoredIgnored = load.driverPay === load.revenue && ['PER_MILE', 'HOURLY'].includes(selectedDriver?.payType || '');
                  const isEstimate = (!load.driverPay || load.driverPay <= 0) || isStoredIgnored;

                  return (
                    <TableRow key={load.id} className={!load.readyForSettlement ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                      <TableCell>
                        <Checkbox checked={selectedLoads.has(load.id)} onCheckedChange={() => onToggleLoad(load.id)} />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <Link href={`/dashboard/loads/${load.loadNumber || load.id}`} className="text-primary hover:underline">{load.loadNumber}</Link>
                          {!load.readyForSettlement && (
                            <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Not Ready
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {load.dispatchNotes && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                                <span className="sr-only">View Notes</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3">
                              <h4 className="text-sm font-medium mb-1">Dispatch Notes</h4>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{load.dispatchNotes}</p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </TableCell>
                      <TableCell>
                        {load.pickupCity}, {load.pickupState} &rarr; {load.deliveryCity}, {load.deliveryState}
                      </TableCell>
                      <TableCell>{load.deliveredAt ? formatDate(load.deliveredAt) : 'N/A'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(load.revenue || 0)}</TableCell>
                      <TableCell className="text-right">
                        {pay > 0 ? (
                          <span>
                            {formatCurrency(pay)}
                            {isEstimate && selectedDriver?.payType && <span className="text-xs ml-1 text-muted-foreground">(est)</span>}
                          </span>
                        ) : (
                          <span className="text-destructive">$0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {load.totalMiles || load.loadedMiles || load.emptyMiles || 0} mi
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {selectedLoads.size > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedLoads.size} load{selectedLoads.size !== 1 ? 's' : ''} selected</span>
              <span className="text-lg font-bold">Total Revenue: {formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-muted-foreground">Estimated Driver Pay:</span>
              <span className={`text-lg font-bold ${totalDriverPay === 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(totalDriverPay)}
              </span>
            </div>
            {totalDriverPay === 0 && selectedDriver && (
              <p className="text-sm text-destructive">
                Driver pay is $0. Check if driver has pay type configured.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
