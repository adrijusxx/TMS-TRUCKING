'use client';

import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deductionTypeLabels } from './types';
import { createDeduction, createAddition, deleteDeduction, deleteAddition } from './api';
import TransactionTypeCombobox from './TransactionTypeCombobox';

interface SettlementTransactionsProps {
  settlementId: string;
  additionsData: any;
  deductionsData: any;
  refetchDeductions: () => void;
  refetchAdditions: () => void;
}

export default function SettlementTransactions({
  settlementId,
  additionsData,
  deductionsData,
  refetchDeductions,
  refetchAdditions,
}: SettlementTransactionsProps) {
  const queryClient = useQueryClient();
  const [customTypes, setCustomTypes] = useState<any[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false);
  const [isAdditionDialogOpen, setIsAdditionDialogOpen] = useState(false);
  const [newDeduction, setNewDeduction] = useState({ deductionType: 'OTHER', description: '', amount: '' });
  const [newAddition, setNewAddition] = useState({ deductionType: 'BONUS', description: '', amount: '' });

  useEffect(() => {
    const fetchCustomTypes = async () => {
      try {
        const res = await fetch('/api/deduction-type-templates?isActive=true');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) setCustomTypes(data.data);
        }
      } catch (error) {
        console.error('Failed to load custom type templates:', error);
      }
    };
    fetchCustomTypes();
  }, []);

  const deleteCustomType = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/deduction-type-templates/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomTypes(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted');
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      toast.error('Error deleting template');
    }
  };

  const createCustomType = async (name: string, category: 'addition' | 'deduction') => {
    try {
      const res = await fetch('/api/deduction-type-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCustomTypes(prev => [...prev, data.data]);
          return data.data.name;
        }
      }
    } catch (error) {
      console.error('Failed to create custom type:', error);
    }
    return name;
  };

  const invalidateSettlement = () => {
    queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
  };

  const createDeductionMutation = useMutation({
    mutationFn: (data: any) => createDeduction(settlementId, data),
    onSuccess: () => {
      toast.success('Deduction added');
      invalidateSettlement();
      queryClient.invalidateQueries({ queryKey: ['settlement-deductions', settlementId] });
      setIsDeductionDialogOpen(false);
      setNewDeduction({ deductionType: 'OTHER', description: '', amount: '' });
      refetchDeductions();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to add deduction'),
  });

  const createAdditionMutation = useMutation({
    mutationFn: (data: any) => createAddition(settlementId, data),
    onSuccess: () => {
      toast.success('Addition added');
      invalidateSettlement();
      queryClient.invalidateQueries({ queryKey: ['settlement-additions', settlementId] });
      setIsAdditionDialogOpen(false);
      setNewAddition({ deductionType: 'BONUS', description: '', amount: '' });
      refetchAdditions();
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to add addition'),
  });

  const deleteDeductionMutation = useMutation({
    mutationFn: (deductionId: string) => deleteDeduction(settlementId, deductionId),
    onSuccess: () => {
      toast.success('Deduction deleted');
      invalidateSettlement();
      queryClient.invalidateQueries({ queryKey: ['settlement-deductions', settlementId] });
      refetchDeductions();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAdditionMutation = useMutation({
    mutationFn: (additionId: string) => deleteAddition(settlementId, additionId),
    onSuccess: () => {
      toast.success('Addition deleted');
      invalidateSettlement();
      queryClient.invalidateQueries({ queryKey: ['settlement-additions', settlementId] });
      refetchAdditions();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const customAdditions = customTypes.filter(t => t.category === 'addition');
  const customDeductions = customTypes.filter(t => t.category === 'deduction');
  const deductions = deductionsData?.data || [];
  const additions = additionsData?.data || [];

  const additionTypeLabel = (type: string) => {
    const labels: Record<string, string> = { BONUS: 'Bonus', OVERTIME: 'Overtime', INCENTIVE: 'Incentive', REIMBURSEMENT: 'Reimbursement' };
    return labels[type] || type;
  };

  return (
    <>
      {/* Additions Section */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Additions
            </CardTitle>
            <Dialog open={isAdditionDialogOpen} onOpenChange={setIsAdditionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Addition</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Addition</DialogTitle>
                  <DialogDescription>Add a bonus, overtime, incentive, or reimbursement</DialogDescription>
                </DialogHeader>
                <TransactionTypeCombobox
                  transaction={newAddition} setTransaction={setNewAddition}
                  customTypes={customAdditions} category="addition"
                  openCombobox={openCombobox} setOpenCombobox={setOpenCombobox}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  createCustomType={createCustomType} deleteCustomType={deleteCustomType}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAdditionDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      if (newAddition.description && newAddition.amount) {
                        createAdditionMutation.mutate({
                          deductionType: newAddition.deductionType,
                          description: newAddition.description,
                          amount: parseFloat(newAddition.amount),
                        });
                      }
                    }}
                    disabled={createAdditionMutation.isPending}
                  >{createAdditionMutation.isPending ? 'Adding...' : 'Add Addition'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {additions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No additions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {additions.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>{additionTypeLabel(a.deductionType)}</TableCell>
                    <TableCell>{a.description}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">+{formatCurrency(a.amount)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => deleteAdditionMutation.mutate(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deductions Section */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Deductions ({deductions.length})
            </CardTitle>
            <Dialog open={isDeductionDialogOpen} onOpenChange={setIsDeductionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Deduction</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Deduction</DialogTitle>
                  <DialogDescription>Add a deduction. Totals will be recalculated automatically.</DialogDescription>
                </DialogHeader>
                <TransactionTypeCombobox
                  transaction={newDeduction} setTransaction={setNewDeduction}
                  customTypes={customDeductions} category="deduction"
                  openCombobox={openCombobox} setOpenCombobox={setOpenCombobox}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  createCustomType={createCustomType} deleteCustomType={deleteCustomType}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeductionDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      if (!newDeduction.description || !newDeduction.amount) {
                        toast.error('Please fill in all fields');
                        return;
                      }
                      createDeductionMutation.mutate({
                        deductionType: newDeduction.deductionType,
                        description: newDeduction.description,
                        amount: parseFloat(newDeduction.amount),
                      });
                    }}
                    disabled={createDeductionMutation.isPending}
                  >
                    {createDeductionMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Deduction'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {deductions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No deductions yet.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>{deductionTypeLabels[d.deductionType] || d.deductionType}</TableCell>
                      <TableCell className="text-right text-red-600">-{formatCurrency(d.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (confirm('Delete this deduction?')) deleteDeductionMutation.mutate(d.id);
                        }} disabled={deleteDeductionMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 bg-muted border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Deductions:</span>
                  <span className="text-lg font-bold text-red-600">
                    -{formatCurrency(deductions.reduce((sum: number, d: any) => sum + d.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
