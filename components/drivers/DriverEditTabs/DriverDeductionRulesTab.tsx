'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import DeductionRuleForm from './DeductionRuleForm';

interface DriverDeductionRulesTabProps {
  driver: any;
}

const TYPE_LABELS: Record<string, string> = {
  FUEL_ADVANCE: 'Fuel Advance', CASH_ADVANCE: 'Cash Advance', INSURANCE: 'Insurance',
  OCCUPATIONAL_ACCIDENT: 'Occupational Accident', TRUCK_PAYMENT: 'Truck Payment',
  TRUCK_LEASE: 'Truck Lease', ESCROW: 'Escrow', EQUIPMENT_RENTAL: 'Equipment Rental',
  MAINTENANCE: 'Maintenance', TOLLS: 'Tolls', PERMITS: 'Permits',
  FUEL_CARD: 'Fuel Card', FUEL_CARD_FEE: 'Fuel Card Fee',
  TRAILER_RENTAL: 'Trailer Rental', OTHER: 'Other',
  BONUS: 'Bonus', OVERTIME: 'Overtime', INCENTIVE: 'Incentive', REIMBURSEMENT: 'Reimbursement',
};

function formatRuleAmount(rule: any): string {
  if (rule.calculationType === 'FIXED') return formatCurrency(rule.amount || 0);
  if (rule.calculationType === 'PERCENTAGE') return `${rule.percentage || 0}%`;
  if (rule.calculationType === 'PER_MILE') return `${formatCurrency(rule.perMileRate || 0)}/mi`;
  return '-';
}

export default function DriverDeductionRulesTab({ driver }: DriverDeductionRulesTabProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [showAdditions, setShowAdditions] = useState(false);

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['deduction-rules', driver.id],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/deduction-rules?driverId=${driver.id}&isActive=true`));
      if (!res.ok) throw new Error('Failed to fetch rules');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(apiUrl('/api/deduction-rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, driverId: driver.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to create rule');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deduction-rules', driver.id] });
      toast.success('Deduction rule created');
      setIsAddDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(apiUrl(`/api/deduction-rules/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to update rule');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deduction-rules', driver.id] });
      toast.success('Rule updated');
      setEditingRule(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const res = await fetch(apiUrl(`/api/deduction-rules/${ruleId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deduction-rules', driver.id] });
      toast.success('Rule deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rules = rulesData?.data || [];
  const deductions = rules.filter((r: any) => !r.isAddition);
  const additions = rules.filter((r: any) => r.isAddition);
  const displayedRules = showAdditions ? additions : deductions;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant={!showAdditions ? 'default' : 'outline'} size="sm" onClick={() => setShowAdditions(false)}>
            Deductions ({deductions.length})
          </Button>
          <Button variant={showAdditions ? 'default' : 'outline'} size="sm" onClick={() => setShowAdditions(true)}>
            Additions ({additions.length})
          </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {showAdditions ? 'Addition' : 'Deduction'} Rule</DialogTitle>
            </DialogHeader>
            <DeductionRuleForm
              isAddition={showAdditions}
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => { if (!open) setEditingRule(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingRule?.isAddition ? 'Addition' : 'Deduction'} Rule</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <DeductionRuleForm
              isAddition={editingRule.isAddition}
              editRule={editingRule}
              onSubmit={(data) => updateMutation.mutate({ id: editingRule.id, data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">
            {showAdditions ? 'Addition' : 'Deduction'} Rules for {driver.user?.firstName} {driver.user?.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : displayedRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No {showAdditions ? 'addition' : 'deduction'} rules found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedRules.map((rule: any) => {
                  const isDriverSpecific = rule.driverId === driver.id;
                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium text-sm">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[rule.deductionType] || rule.deductionType.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatRuleAmount(rule)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(rule.deductionFrequency || rule.frequency || 'PER_SETTLEMENT').replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isDriverSpecific ? 'default' : 'secondary'} className="text-xs">
                          {isDriverSpecific ? 'Driver-specific' : 'MC-Wide'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {rule.goalAmount
                          ? <span>{formatCurrency(rule.currentAmount || 0)} / {formatCurrency(rule.goalAmount)}</span>
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-xs">
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isDriverSpecific && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => setEditingRule(rule)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => {
                                if (confirm('Delete this rule?')) deleteMutation.mutate(rule.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
