'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SettlementPreviewDialog } from '@/components/settlements/SettlementPreviewDialog';
import { fetchDrivers, fetchDriverSettlementEligibleLoads, generateSettlement } from './generate-settlement/api';
import { calculateLoadDriverPay } from './generate-settlement/calculateLoadDriverPay';
import LoadSelectionTable from './generate-settlement/LoadSelectionTable';

function formatPayRate(driver: any): string {
  if (!driver.payType || !driver.payRate) return '';
  switch (driver.payType) {
    case 'PER_MILE': return `${formatCurrency(driver.payRate)}/mile`;
    case 'PERCENTAGE': return `${driver.payRate}%`;
    case 'PER_LOAD': return `${formatCurrency(driver.payRate)}/load`;
    default: return `${formatCurrency(driver.payRate)}/hour`;
  }
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
  const [showPreview, setShowPreview] = useState(false);

  const { data: driversData } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });
  const { data: loadsData, isLoading: loadsLoading } = useQuery({
    queryKey: ['settlement-eligible-loads', selectedDriverId],
    queryFn: () => fetchDriverSettlementEligibleLoads(selectedDriverId),
    enabled: !!selectedDriverId,
    staleTime: 30000,
  });

  const generateMutation = useMutation({
    mutationFn: generateSettlement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['settlement-eligible-loads', selectedDriverId] });
      toast.success(`Settlement ${data.data?.settlementNumber || ''} generated successfully`);
      setSelectedDriverId('');
      setSelectedLoads(new Set());
    },
    onError: (error: any) => {
      toast.error(error.errorDetails?.message || error.message || 'Failed to generate settlement');
    },
  });

  const drivers = driversData?.data || [];
  const availableLoads = loadsData?.data || [];
  const selectedDriver = drivers.find((d: any) => d.id === selectedDriverId);

  useEffect(() => {
    if (selectedDriverId) setSelectedLoads(new Set());
  }, [selectedDriverId]);

  const handleToggleLoad = (loadId: string) => {
    const next = new Set(selectedLoads);
    next.has(loadId) ? next.delete(loadId) : next.add(loadId);
    setSelectedLoads(next);
  };

  const handleSelectAll = () => {
    setSelectedLoads(
      selectedLoads.size === availableLoads.length ? new Set() : new Set(availableLoads.map((l: any) => l.id))
    );
  };

  const totalRevenue = availableLoads
    .filter((l: any) => selectedLoads.has(l.id))
    .reduce((sum: number, l: any) => sum + (l.revenue || 0), 0);

  const totalDriverPay = availableLoads
    .filter((l: any) => selectedLoads.has(l.id))
    .reduce((sum: number, l: any) => sum + calculateLoadDriverPay(l, selectedDriver), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) { toast.error('Please select a driver'); return; }
    if (selectedLoads.size === 0) { toast.error('Please select at least one load'); return; }

    const loadsToSettle = availableLoads.filter((l: any) => selectedLoads.has(l.id));
    const zeroPayLoads = loadsToSettle.filter((l: any) => calculateLoadDriverPay(l, selectedDriver) <= 0);
    if (zeroPayLoads.length > 0) {
      toast.warning(`${zeroPayLoads.length} load(s) have $0 driver pay`, {
        description: `Loads: ${zeroPayLoads.map((l: any) => l.loadNumber).join(', ')}. Verify pay configuration.`,
        duration: 8000,
      });
    }

    const dates = loadsToSettle.map((l: any) => l.deliveredAt ? new Date(l.deliveredAt).getTime() : 0).filter((d: number) => d > 0);
    const periodStart = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const periodEnd = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    import('@/lib/validations/settlement-validation').then(({ validateLoadsForSettlement }) => {
      const { data: config } = queryClient.getQueryState(['accounting-settings']) || {};
      const validationConfig = (config as any) || { requireDeliveredStatus: true, settlementValidationMode: 'FLEXIBLE' };
      const validation = validateLoadsForSettlement(loadsToSettle, validationConfig, { start: periodStart, end: periodEnd });

      if (validation.invalidLoads.length > 0) {
        toast.error('Validation Failed', { description: `${validation.invalidLoads.length} loads do not meet settlement requirements.` });
        validation.invalidLoads.forEach((result: any) => {
          toast.error(`Load ${result.load.loadNumber} - Cannot Settle`, {
            description: result.errors.map((e: any) => `${e.message}`).join('\n'),
            duration: 5000,
            action: { label: 'View', onClick: () => window.open(`/dashboard/loads/${result.load.loadNumber}`, '_blank') },
          });
        });
        return;
      }

      if (validation.loadsWithWarnings.length > 0) {
        validation.loadsWithWarnings.forEach((result: any) => {
          toast.warning(`Load ${result.load.loadNumber} - Warning`, {
            description: result.warnings.map((w: any) => `${w.message}`).join('\n'),
            duration: 5000,
          });
        });
      }

      setShowPreview(true);
    });
  };

  const handleConfirmGenerate = () => {
    generateMutation.mutate({
      driverId: selectedDriverId,
      loadIds: Array.from(selectedLoads),
      settlementNumber: settlementNumber || undefined,
      deductions: parseFloat(deductions) || 0,
      advances: parseFloat(advances) || 0,
      notes: notes || undefined,
    });
    setShowPreview(false);
  };

  const previewLoads = availableLoads
    .filter((l: any) => selectedLoads.has(l.id))
    .map((l: any) => ({
      loadNumber: l.loadNumber,
      revenue: l.revenue || 0,
      driverPay: calculateLoadDriverPay(l, selectedDriver),
      totalMiles: l.totalMiles || l.loadedMiles || 0,
    }));

  // Pre-fetch accounting settings
  useQuery({
    queryKey: ['accounting-settings'],
    queryFn: async () => { const res = await fetch('/api/accounting-settings'); return res.ok ? res.json() : null; },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settlements"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold">Generate Settlement</h1>
          <p className="text-muted-foreground">Create a new settlement for a driver by selecting completed loads</p>
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
                  <Button variant="outline" role="combobox" aria-expanded={openDriverSelect} className="w-full justify-between">
                    {selectedDriverId ? (() => {
                      const d = drivers.find((driver: any) => driver.id === selectedDriverId);
                      if (!d) return 'Select a driver';
                      const rate = formatPayRate(d);
                      return `${d.user?.firstName} ${d.user?.lastName}${rate ? ` - ${rate}` : ''}`;
                    })() : 'Select a driver'}
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
                            onSelect={() => { setSelectedDriverId(driver.id); setOpenDriverSelect(false); }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedDriverId === driver.id ? 'opacity-100' : 'opacity-0')} />
                            {driver.user?.firstName} {driver.user?.lastName}
                            {driver.payType && <span className="ml-2 text-muted-foreground text-xs"> - {formatPayRate(driver)}</span>}
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
                      <p><strong>Pay Type:</strong> {selectedDriver.payType || <span className="text-destructive">Not set</span>}</p>
                      <p><strong>Pay Rate:</strong> {selectedDriver.payRate ? formatPayRate(selectedDriver) : <span className="text-destructive">Not set</span>}</p>
                    </div>
                  </AlertDescription>
                </Alert>
                {(!selectedDriver.payType || !selectedDriver.payRate) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Pay Configuration Required</AlertTitle>
                    <AlertDescription>
                      This driver does not have pay type and rate configured. Settlement calculations will be $0.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Load Selection */}
        {selectedDriverId && (
          <LoadSelectionTable
            availableLoads={availableLoads}
            selectedLoads={selectedLoads}
            selectedDriver={selectedDriver}
            loadsLoading={loadsLoading}
            totalRevenue={totalRevenue}
            totalDriverPay={totalDriverPay}
            onToggleLoad={handleToggleLoad}
            onSelectAll={handleSelectAll}
          />
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
              <Input id="settlementNumber" value={settlementNumber} onChange={(e) => setSettlementNumber(e.target.value)} placeholder="Auto-generated if left empty" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deductions">Deductions</Label>
                <Input id="deductions" type="number" step="0.01" min="0" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advances">Advances</Label>
                <Input id="advances" type="number" step="0.01" min="0" value={advances} onChange={(e) => setAdvances(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any notes about this settlement" rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link href="/dashboard/settlements"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={generateMutation.isPending || !selectedDriverId || selectedLoads.size === 0}>
            {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Settlement
          </Button>
        </div>
      </form>

      <SettlementPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        onConfirm={handleConfirmGenerate}
        isSubmitting={generateMutation.isPending}
        driver={selectedDriver ? {
          firstName: selectedDriver.user?.firstName,
          lastName: selectedDriver.user?.lastName,
          driverNumber: selectedDriver.driverNumber,
          payType: selectedDriver.payType,
          payRate: selectedDriver.payRate,
        } : null}
        selectedLoads={previewLoads}
        totalRevenue={totalRevenue}
        totalDriverPay={totalDriverPay}
        deductions={parseFloat(deductions) || 0}
        advances={parseFloat(advances) || 0}
        settlementNumber={settlementNumber}
      />
    </div>
  );
}
