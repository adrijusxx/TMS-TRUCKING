'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { ArrowLeft, FileText, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000&isActive=true'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

async function fetchAllSettlementEligibleLoads() {
  // Query for all settlement-eligible statuses: DELIVERED, INVOICED, PAID
  // Don't filter by driver - we'll do that locally for better debugging
  const response = await fetch(
    apiUrl(`/api/loads?status=DELIVERED&status=INVOICED&status=PAID&limit=200`)
  );
  if (!response.ok) throw new Error('Failed to fetch loads');
  const data = await response.json();
  console.log('[Settlement] Fetched eligible loads:', data.data?.length || 0);
  return data;
}

async function generateSettlement(data: {
  driverId: string;
  loadIds: string[];
  settlementNumber?: string;
  deductions?: number;
  advances?: number;
  notes?: string;
}) {
  const response = await fetch(apiUrl('/api/settlements/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    const customError: any = new Error(error.error?.message || 'Failed to generate settlement');
    customError.errorDetails = error.error;
    customError.statusCode = response.status;
    throw customError;
  }
  return response.json();
}

export default function GenerateSettlementForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(new Set());
  const [settlementNumber, setSettlementNumber] = useState('');
  const [deductions, setDeductions] = useState('0');
  const [advances, setAdvances] = useState('0');
  const [notes, setNotes] = useState('');

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
  });

  // Fetch ALL settlement-eligible loads (not filtered by driver)
  // This allows us to debug and see what's available
  const { data: loadsData, isLoading: loadsLoading } = useQuery({
    queryKey: ['settlement-eligible-loads'],
    queryFn: fetchAllSettlementEligibleLoads,
    staleTime: 30000, // Cache for 30 seconds
  });

  const generateMutation = useMutation({
    mutationFn: generateSettlement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Settlement generated successfully');
      if (data.data?.id) {
        router.push(`/dashboard/settlements/${data.data.id}`);
      }
    },
    onError: (error: any) => {
      const errorDetails = error.errorDetails;
      const errorMessage = errorDetails?.message || error.message || 'Failed to generate settlement';
      toast.error(errorMessage);
      console.error('Settlement generation error:', error);
    },
  });

  const drivers = driversData?.data || [];
  const allLoads = loadsData?.data || [];

  // Filter loads by selected driver (client-side filtering)
  const availableLoads = allLoads.filter((load: any) => {
    // Must match selected driver
    if (!selectedDriverId) return false;
    if (load.driverId !== selectedDriverId) return false;
    // TODO: Filter out loads already in a settlement
    return true;
  });

  // Debug: Log when driver is selected
  useEffect(() => {
    if (selectedDriverId && allLoads.length > 0) {
      const matchingLoads = allLoads.filter((l: any) => l.driverId === selectedDriverId);
      console.log(`[Settlement] Driver ${selectedDriverId} selected. All loads: ${allLoads.length}, Matching loads: ${matchingLoads.length}`);
      if (matchingLoads.length === 0) {
        console.log('[Settlement] No matching loads. Available driver IDs in loads:',
          [...new Set(allLoads.map((l: any) => l.driverId))].filter(Boolean)
        );
      }
    }
  }, [selectedDriverId, allLoads]);

  const handleToggleLoad = (loadId: string) => {
    const newSelected = new Set(selectedLoads);
    if (newSelected.has(loadId)) {
      newSelected.delete(loadId);
    } else {
      newSelected.add(loadId);
    }
    setSelectedLoads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLoads.size === availableLoads.length) {
      setSelectedLoads(new Set());
    } else {
      setSelectedLoads(new Set(availableLoads.map((load: any) => load.id)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }
    if (selectedLoads.size === 0) {
      toast.error('Please select at least one load');
      return;
    }

    generateMutation.mutate({
      driverId: selectedDriverId,
      loadIds: Array.from(selectedLoads),
      settlementNumber: settlementNumber || undefined,
      deductions: parseFloat(deductions) || 0,
      advances: parseFloat(advances) || 0,
      notes: notes || undefined,
    });
  };

  const selectedDriver = drivers.find((d: any) => d.id === selectedDriverId);
  const totalRevenue = availableLoads
    .filter((load: any) => selectedLoads.has(load.id))
    .reduce((sum: number, load: any) => sum + (load.revenue || 0), 0);

  // Calculate driver pay for a load based on driver's pay settings
  const calculateLoadDriverPay = (load: any): number => {
    if (!selectedDriver) return load.driverPay || 0;

    // If load already has driver pay stored, use it
    if (load.driverPay && load.driverPay > 0) {
      return load.driverPay;
    }

    // Calculate based on driver's pay type
    if (!selectedDriver.payType || !selectedDriver.payRate) {
      return 0;
    }

    const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
    const revenue = load.revenue || 0;

    switch (selectedDriver.payType) {
      case 'PER_MILE':
        return miles * selectedDriver.payRate;
      case 'PER_LOAD':
        return selectedDriver.payRate;
      case 'PERCENTAGE':
        return revenue * (selectedDriver.payRate / 100);
      case 'HOURLY':
        const estimatedHours = miles > 0 ? miles / 50 : 10;
        return estimatedHours * selectedDriver.payRate;
      default:
        return 0;
    }
  };

  // Calculate total estimated driver pay for selected loads
  const totalDriverPay = availableLoads
    .filter((load: any) => selectedLoads.has(load.id))
    .reduce((sum: number, load: any) => sum + calculateLoadDriverPay(load), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settlements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Generate Settlement</h1>
          <p className="text-muted-foreground">
            Create a new settlement for a driver by selecting completed loads
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Driver Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Selection</CardTitle>
            <CardDescription>Select the driver for this settlement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Driver *</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {driversLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading drivers...
                    </SelectItem>
                  ) : drivers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No drivers found
                    </SelectItem>
                  ) : (
                    drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user?.firstName} {driver.user?.lastName} ({driver.driverNumber})
                        {driver.payType && ` - ${driver.payType === 'PER_MILE' ? `${formatCurrency(driver.payRate)}/mile` : driver.payType === 'PERCENTAGE' ? `${driver.payRate}%` : driver.payType === 'PER_LOAD' ? `${formatCurrency(driver.payRate)}/load` : `${formatCurrency(driver.payRate)}/hour`}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedDriver && (
              <>
                <Alert variant={!selectedDriver.payType || !selectedDriver.payRate ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Driver Information</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1">
                      <p>
                        <strong>Pay Type:</strong> {selectedDriver.payType || <span className="text-destructive">Not set</span>}
                      </p>
                      <p>
                        <strong>Pay Rate:</strong>{' '}
                        {selectedDriver.payRate
                          ? selectedDriver.payType === 'PER_MILE'
                            ? `${formatCurrency(selectedDriver.payRate)}/mile`
                            : selectedDriver.payType === 'PERCENTAGE'
                              ? `${selectedDriver.payRate}%`
                              : selectedDriver.payType === 'PER_LOAD'
                                ? `${formatCurrency(selectedDriver.payRate)}/load`
                                : `${formatCurrency(selectedDriver.payRate)}/hour`
                          : <span className="text-destructive">Not set</span>}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
                {(!selectedDriver.payType || !selectedDriver.payRate) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Pay Configuration Required</AlertTitle>
                    <AlertDescription>
                      This driver does not have pay type and rate configured. Settlement calculations will be $0.
                      Please configure the driver's pay settings first.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Load Selection */}
        {selectedDriverId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Load Selection</CardTitle>
                  <CardDescription>
                    Select completed loads to include in this settlement
                  </CardDescription>
                </div>
                {availableLoads.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
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
                    No delivered loads found for this driver. Loads must be marked as DELIVERED to
                    be included in a settlement.
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
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Load #</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Driver Pay</TableHead>
                        <TableHead className="text-right">Miles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableLoads.map((load: any) => (
                        <TableRow key={load.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLoads.has(load.id)}
                              onCheckedChange={() => handleToggleLoad(load.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <Link
                              href={`/dashboard/loads/${load.id}`}
                              className="text-primary hover:underline"
                            >
                              {load.loadNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                            {load.deliveryState}
                          </TableCell>
                          <TableCell>
                            {load.deliveredAt ? formatDate(load.deliveredAt) : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(load.revenue || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {load.driverPay && load.driverPay > 0 ? (
                              formatCurrency(load.driverPay)
                            ) : selectedDriver?.payType ? (
                              <span className="text-muted-foreground">
                                {formatCurrency(calculateLoadDriverPay(load))}
                                <span className="text-xs ml-1">(est)</span>
                              </span>
                            ) : (
                              <span className="text-destructive">$0.00</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {load.totalMiles || load.loadedMiles || load.emptyMiles || 0} mi
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {selectedLoads.size > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {selectedLoads.size} load{selectedLoads.size !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-lg font-bold">
                      Total Revenue: {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-muted-foreground">Estimated Driver Pay:</span>
                    <span className={`text-lg font-bold ${totalDriverPay === 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(totalDriverPay)}
                    </span>
                  </div>
                  {totalDriverPay === 0 && selectedDriver && (
                    <p className="text-sm text-destructive">
                      ⚠️ Driver pay is $0. Check if driver has pay type configured.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settlement Details */}
        <Card>
          <CardHeader>
            <CardTitle>Settlement Details</CardTitle>
            <CardDescription>Optional settlement information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settlementNumber">Settlement Number (Optional)</Label>
              <Input
                id="settlementNumber"
                value={settlementNumber}
                onChange={(e) => setSettlementNumber(e.target.value)}
                placeholder="Auto-generated if left empty"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deductions">Deductions</Label>
                <Input
                  id="deductions"
                  type="number"
                  step="0.01"
                  min="0"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advances">Advances</Label>
                <Input
                  id="advances"
                  type="number"
                  step="0.01"
                  min="0"
                  value={advances}
                  onChange={(e) => setAdvances(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this settlement"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link href="/dashboard/settlements">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              generateMutation.isPending ||
              !selectedDriverId ||
              selectedLoads.size === 0
            }
          >
            {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Settlement
          </Button>
        </div>
      </form>
    </div>
  );
}



