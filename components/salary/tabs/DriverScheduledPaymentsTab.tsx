'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Loader2, Pause, Play } from 'lucide-react';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const DEDUCTION_TYPES = [
  'FUEL_ADVANCE', 'CASH_ADVANCE', 'INSURANCE', 'OCCUPATIONAL_ACCIDENT',
  'TRUCK_PAYMENT', 'TRUCK_LEASE', 'ESCROW', 'EQUIPMENT_RENTAL',
  'MAINTENANCE', 'TOLLS', 'PERMITS', 'FUEL_CARD', 'FUEL_CARD_FEE',
  'TRAILER_RENTAL', 'OTHER',
] as const;

const ADDITION_TYPES = ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] as const;

const frequencyLabel: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  PER_SETTLEMENT: 'Per Settlement',
};

const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const calcDisplay = (rule: any): string => {
  if (rule.calculationType === 'FIXED') return formatCurrency(rule.amount || 0);
  if (rule.calculationType === 'PERCENTAGE') return `${rule.percentage || 0}%`;
  if (rule.calculationType === 'PER_MILE') return `${formatCurrency(rule.perMileRate || 0)}/mi`;
  return '-';
};

export default function DriverScheduledPaymentsTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  // Form state
  const [driverId, setDriverId] = React.useState('');
  const [name, setName] = React.useState('');
  const [isAddition, setIsAddition] = React.useState(false);
  const [deductionType, setDeductionType] = React.useState('OTHER');
  const [calculationType, setCalculationType] = React.useState('FIXED');
  const [amount, setAmount] = React.useState('');
  const [percentage, setPercentage] = React.useState('');
  const [perMileRate, setPerMileRate] = React.useState('');
  const [frequency, setFrequency] = React.useState('PER_SETTLEMENT');
  const [goalAmount, setGoalAmount] = React.useState('');

  const { data: driversData } = useQuery({
    queryKey: ['drivers-list-simple'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/drivers?limit=200'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['deduction-rules-scheduled'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/deduction-rules'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const drivers = driversData?.data || [];
  const allRules = data?.data || [];
  // Filter to recurring rules (exclude ONE_TIME)
  const scheduledRules = allRules.filter((r: any) => {
    const freq = r.frequency || r.deductionFrequency;
    return freq && freq !== 'ONE_TIME';
  });

  const getDriverName = (rule: any) => {
    const driver = drivers.find((d: any) => d.id === rule.driverId);
    if (driver) return `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.trim();
    return rule.driverId ? 'Unknown' : 'Company-wide';
  };

  const getScope = (rule: any): string => {
    if (rule.driverId) return 'Driver-specific';
    if (rule.driverType) return typeLabel(rule.driverType);
    return 'Company-wide';
  };

  const handleCreate = async () => {
    if (!name) { toast.error('Name is required'); return; }
    if (calculationType === 'FIXED' && !amount) { toast.error('Amount is required'); return; }
    if (calculationType === 'PERCENTAGE' && !percentage) { toast.error('Percentage is required'); return; }
    if (calculationType === 'PER_MILE' && !perMileRate) { toast.error('Per mile rate is required'); return; }

    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/deduction-rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          deductionType,
          isAddition,
          driverId: driverId || undefined,
          calculationType,
          amount: calculationType === 'FIXED' ? parseFloat(amount) : undefined,
          percentage: calculationType === 'PERCENTAGE' ? parseFloat(percentage) : undefined,
          perMileRate: calculationType === 'PER_MILE' ? parseFloat(perMileRate) : undefined,
          frequency,
          goalAmount: goalAmount ? parseFloat(goalAmount) : undefined,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed');
      }
      toast.success('Scheduled payment created');
      queryClient.invalidateQueries({ queryKey: ['deduction-rules-scheduled'] });
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(apiUrl(`/api/deduction-rules/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(currentActive ? 'Payment paused' : 'Payment activated');
      queryClient.invalidateQueries({ queryKey: ['deduction-rules-scheduled'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setDriverId(''); setName(''); setIsAddition(false); setDeductionType('OTHER');
    setCalculationType('FIXED'); setAmount(''); setPercentage(''); setPerMileRate('');
    setFrequency('PER_SETTLEMENT'); setGoalAmount('');
  };

  const types = isAddition ? ADDITION_TYPES : DEDUCTION_TYPES;

  if (isLoading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Recurring driver deductions and additions applied per settlement
        </p>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Schedule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Scheduled Payment</DialogTitle>
              <DialogDescription>Set up a recurring deduction or addition for drivers.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Driver (optional — leave blank for company-wide)</Label>
                <Select value={driverId} onValueChange={setDriverId}>
                  <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.user?.firstName} {d.user?.lastName} ({d.driverNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Weekly insurance" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={isAddition ? 'addition' : 'deduction'} onValueChange={(v) => {
                    setIsAddition(v === 'addition');
                    setDeductionType(v === 'addition' ? 'BONUS' : 'OTHER');
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deduction">Deduction</SelectItem>
                      <SelectItem value="addition">Addition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={deductionType} onValueChange={setDeductionType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>{typeLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Calculation</Label>
                  <Select value={calculationType} onValueChange={setCalculationType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="PER_MILE">Per Mile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{calculationType === 'PERCENTAGE' ? 'Percentage' : calculationType === 'PER_MILE' ? 'Rate/Mile' : 'Amount'}</Label>
                  {calculationType === 'FIXED' && (
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  )}
                  {calculationType === 'PERCENTAGE' && (
                    <Input type="number" step="0.1" min="0" max="100" value={percentage} onChange={(e) => setPercentage(e.target.value)} />
                  )}
                  {calculationType === 'PER_MILE' && (
                    <Input type="number" step="0.001" value={perMileRate} onChange={(e) => setPerMileRate(e.target.value)} />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_SETTLEMENT">Per Settlement</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Goal Amount (optional)</Label>
                  <Input type="number" step="0.01" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="e.g., 5000" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Driver</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Goal / Current</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledRules.map((rule: any) => {
              const freq = rule.frequency || rule.deductionFrequency;
              return (
                <TableRow key={rule.id} className={!rule.isActive ? 'opacity-50' : ''}>
                  <TableCell>{getDriverName(rule)}</TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant={rule.isAddition ? 'default' : 'secondary'}>
                      {rule.isAddition ? 'Addition' : 'Deduction'}
                    </Badge>
                  </TableCell>
                  <TableCell>{typeLabel(rule.deductionType)}</TableCell>
                  <TableCell>{calcDisplay(rule)}</TableCell>
                  <TableCell>{frequencyLabel[freq] || freq}</TableCell>
                  <TableCell>
                    {rule.goalAmount
                      ? `${formatCurrency(rule.currentAmount || 0)} / ${formatCurrency(rule.goalAmount)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{getScope(rule)}</TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? 'default' : 'outline'}>
                      {rule.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(rule.id, rule.isActive)}>
                      {rule.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {scheduledRules.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No scheduled payments
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
