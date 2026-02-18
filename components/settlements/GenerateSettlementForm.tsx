'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, ArrowLeft, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000&isActive=true'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

async function fetchDriverSettlementEligibleLoads(driverId: string) {
  if (!driverId) return { data: [] };

  // Query specific logic:
  // 1. Filter by specific driver
  // 2. Statuses: DELIVERED, INVOICED, PAID
  // 3. REMOVED: readyForSettlement=true constraint. We want to show ALL delivered loads
  //    and let the user decide. We will warn if not ready.
  // 4. limit: 500
  const response = await fetch(
    apiUrl(`/api/loads?driverId=${driverId}&status=DELIVERED&status=INVOICED&status=PAID&limit=500`)
  );
  if (!response.ok) throw new Error('Failed to fetch loads');
  const data = await response.json();
  console.log(`[Settlement] Fetched eligible loads for driver ${driverId}:`, data.data?.length || 0);
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
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [openDriverSelect, setOpenDriverSelect] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(searchParams.get('driverId') || '');
  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(new Set());
  const [settlementNumber, setSettlementNumber] = useState('');
  const [deductions, setDeductions] = useState('0');
  const [advances, setAdvances] = useState('0');
  const [notes, setNotes] = useState('');

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
  });

  // Fetch loads filtered by driver (Server-Side Filtering)
  const { data: loadsData, isLoading: loadsLoading } = useQuery({
    queryKey: ['settlement-eligible-loads', selectedDriverId],
    queryFn: () => fetchDriverSettlementEligibleLoads(selectedDriverId),
    enabled: !!selectedDriverId, // Only fetch when driver is selected
    staleTime: 30000,
  });


  const generateMutation = useMutation({
    mutationFn: generateSettlement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      // Invalidate the specific driver load query
      queryClient.invalidateQueries({ queryKey: ['settlement-eligible-loads', selectedDriverId] });

      toast.success(`Settlement ${data.data?.settlementNumber || ''} generated successfully`);
      // Reset form so user can generate another settlement
      setSelectedDriverId('');
      setSelectedLoads(new Set());
    },
    onError: (error: any) => {
      const errorDetails = error.errorDetails;
      const errorMessage = errorDetails?.message || error.message || 'Failed to generate settlement';
      toast.error(errorMessage);
      console.error('Settlement generation error:', error);
    },
  });

  const drivers = driversData?.data || [];
  const availableLoads = loadsData?.data || [];

  // Logic for debugging is now simplified as we trust server filtering
  useEffect(() => {
    if (selectedDriverId) {
      // Create a fresh set when changing drivers
      setSelectedLoads(new Set());
    }
  }, [selectedDriverId]);

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

  const { data: _config } = useQuery({
    queryKey: ['accounting-settings'],
    queryFn: async () => {
      const res = await fetch('/api/accounting-settings');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const validationConfig = _config || {
    // Default fallback if loading fails
    requireDeliveredStatus: true,
    settlementValidationMode: 'FLEXIBLE',
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

    // Validate Loads
    const loadsToSettle = availableLoads.filter((l: any) => selectedLoads.has(l.id));

    // Zero-pay guard: warn if any selected load has $0 driver pay
    const zeroPayLoads = loadsToSettle.filter((l: any) => {
      const pay = calculateLoadDriverPay(l);
      return pay <= 0;
    });
    if (zeroPayLoads.length > 0) {
      toast.warning(`${zeroPayLoads.length} load(s) have $0 driver pay`, {
        description: `Loads: ${zeroPayLoads.map((l: any) => l.loadNumber).join(', ')}. Verify pay configuration before proceeding.`,
        duration: 8000,
      });
    }

    // Infer period for validation context (min/max delivery date)
    const dates = loadsToSettle
      .map((l: any) => l.deliveredAt ? new Date(l.deliveredAt).getTime() : 0)
      .filter((d: number) => d > 0);

    const periodStart = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const periodEnd = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    // Import the validation function dynamically to avoid server-side issues if any
    import('@/lib/validations/settlement-validation').then(({ validateLoadsForSettlement }) => {
      const validation = validateLoadsForSettlement(loadsToSettle, validationConfig, {
        start: periodStart,
        end: periodEnd
      });

      // Handle Invalid Loads (Blocking Errors)
      if (validation.invalidLoads.length > 0) {
        toast.error('Validation Failed', {
          description: `${validation.invalidLoads.length} loads do not meet settlement requirements.`,
        });

        validation.invalidLoads.forEach((result) => {
          const errorMessages = result.errors.map((e) => `• ${e.message}`).join('\n');
          toast.error(`Load ${result.load.loadNumber} - Cannot Settle`, {
            description: errorMessages,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => window.open(`/dashboard/loads/${result.load.loadNumber}`, '_blank'), // Simple redirect for now
            }
          });
        });
        return; // BLOCK submission
      }

      // Handle Warnings (Non-blocking)
      if (validation.loadsWithWarnings.length > 0) {
        validation.loadsWithWarnings.forEach((result) => {
          const warningMessages = result.warnings.map((w) => `• ${w.message}`).join('\n');
          toast.warning(`Load ${result.load.loadNumber} - Warning`, {
            description: warningMessages,
            duration: 5000,
          });
        });
        // Continue execution...
      }

      // Proceed if valid
      generateMutation.mutate({
        driverId: selectedDriverId,
        loadIds: Array.from(selectedLoads),
        settlementNumber: settlementNumber || undefined,
        deductions: parseFloat(deductions) || 0,
        advances: parseFloat(advances) || 0,
        notes: notes || undefined,
      });
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
    let shouldUseStored = load.driverPay && load.driverPay > 0;

    // Heuristic: If stored pay equals revenue exactly, and driver is PER_MILE or HOURLY, 
    // it's likely an import default, so we should recalculate.
    if (shouldUseStored && load.driverPay === load.revenue && ['PER_MILE', 'HOURLY'].includes(selectedDriver.payType || '')) {
      shouldUseStored = false;
    }

    if (shouldUseStored) {
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
              <Popover open={openDriverSelect} onOpenChange={setOpenDriverSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDriverSelect}
                    className="w-full justify-between"
                  >
                    {selectedDriverId
                      ? (() => {
                        const d = drivers.find((driver: any) => driver.id === selectedDriverId);
                        if (!d) return "Select a driver";
                        return `${d.user?.firstName} ${d.user?.lastName}${d.payType ? ` - ${d.payType === 'PER_MILE' ? `${formatCurrency(d.payRate)}/mile` : d.payType === 'PERCENTAGE' ? `${d.payRate}%` : d.payType === 'PER_LOAD' ? `${formatCurrency(d.payRate)}/load` : `${formatCurrency(d.payRate)}/hour`}` : ''}`;
                      })()
                      : "Select a driver"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search driver..." />
                    <CommandList>
                      <CommandEmpty>No driver found.</CommandEmpty>
                      <CommandGroup>
                        {drivers.map((driver: any) => (
                          <CommandItem
                            key={driver.id}
                            value={`${driver.user?.firstName} ${driver.user?.lastName}`}
                            onSelect={() => {
                              setSelectedDriverId(driver.id);
                              setOpenDriverSelect(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDriverId === driver.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {driver.user?.firstName} {driver.user?.lastName}
                            <span className="ml-2 text-muted-foreground text-xs">
                              {driver.payType && ` - ${driver.payType === 'PER_MILE' ? `${formatCurrency(driver.payRate)}/mile` : driver.payType === 'PERCENTAGE' ? `${driver.payRate}%` : driver.payType === 'PER_LOAD' ? `${formatCurrency(driver.payRate)}/load` : `${formatCurrency(driver.payRate)}/hour`}`}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                    <div className="space-y-2">
                      <p>No delivered loads found for this driver in the selected period.</p>
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <p className="font-semibold mb-1">Troubleshooting Checklist:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Is the load status <strong>DELIVERED</strong>, <strong>INVOICED</strong>, or <strong>PAID</strong>?</li>
                          <li>Is the correct <strong>Driver</strong> assigned to the load?</li>
                          <li>Has the <strong>POD</strong> been uploaded? (Required for "Ready for Settlement" flag)</li>
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
                            onCheckedChange={handleSelectAll}
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
                      {availableLoads.map((load: any) => (
                        <TableRow key={load.id} className={!load.readyForSettlement ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLoads.has(load.id)}
                              onCheckedChange={() => handleToggleLoad(load.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <Link
                                href={`/dashboard/loads/${load.id}`}
                                className="text-primary hover:underline"
                              >
                                {load.loadNumber}
                              </Link>
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
                            {(() => {
                              const pay = calculateLoadDriverPay(load);
                              // Show (est) if we are calculating it and expecting a stored value,
                              // OR if we ignored the stored value (which means we are estimating/recalc).
                              // Actually, just showing the value is fine, but keeping (est) if no stored value existed is good.
                              // If we ignored stored value, we are treating it as 'calculated', so (est) is appropriate.
                              const isStoredIgnored = load.driverPay === load.revenue && ['PER_MILE', 'HOURLY'].includes(selectedDriver?.payType || '');
                              const isEstimate = (!load.driverPay || load.driverPay <= 0) || isStoredIgnored;

                              return pay > 0 ? (
                                <span>
                                  {formatCurrency(pay)}
                                  {isEstimate && selectedDriver?.payType && <span className="text-xs ml-1 text-muted-foreground">(est)</span>}
                                </span>
                              ) : (
                                <span className="text-destructive">$0.00</span>
                              );
                            })()}
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
