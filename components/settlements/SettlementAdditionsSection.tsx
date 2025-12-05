'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface Addition {
  id: string;
  deductionType: string;
  description: string;
  amount: number;
}

interface SettlementAdditionsSectionProps {
  additions: Addition[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (addition: { deductionType: string; description: string; amount: number }) => void;
  onDelete: (id: string) => void;
  isAddingAddition: boolean;
}

const additionTypeLabels: Record<string, string> = {
  BONUS: 'Bonus',
  OVERTIME: 'Overtime',
  INCENTIVE: 'Incentive',
  REIMBURSEMENT: 'Reimbursement',
};

export function SettlementAdditionsSection({
  additions,
  isOpen,
  onOpenChange,
  onAdd,
  onDelete,
  isAddingAddition,
}: SettlementAdditionsSectionProps) {
  const [newAddition, setNewAddition] = useState({
    deductionType: 'BONUS',
    description: '',
    amount: '',
  });

  const handleAdd = () => {
    if (newAddition.description && newAddition.amount) {
      onAdd({
        deductionType: newAddition.deductionType,
        description: newAddition.description,
        amount: parseFloat(newAddition.amount),
      });
      setNewAddition({ deductionType: 'BONUS', description: '', amount: '' });
    }
  };

  const totalAdditions = additions.reduce((sum, add) => sum + add.amount, 0);

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Additions
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Addition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Addition</DialogTitle>
                <DialogDescription>
                  Add a bonus, overtime, incentive, or reimbursement to this settlement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="additionType">Type *</Label>
                  <Select
                    value={newAddition.deductionType}
                    onValueChange={(value) =>
                      setNewAddition({ ...newAddition, deductionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BONUS">Bonus</SelectItem>
                      <SelectItem value="OVERTIME">Overtime</SelectItem>
                      <SelectItem value="INCENTIVE">Incentive</SelectItem>
                      <SelectItem value="REIMBURSEMENT">Reimbursement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Safety Bonus, Extra Hours"
                    value={newAddition.description}
                    onChange={(e) =>
                      setNewAddition({ ...newAddition, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAddition.amount}
                    onChange={(e) =>
                      setNewAddition({ ...newAddition, amount: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={isAddingAddition}>
                  {isAddingAddition ? 'Adding...' : 'Add Addition'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {additions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No additions added to this settlement
          </p>
        ) : (
          <>
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
                {additions.map((addition) => (
                  <TableRow key={addition.id}>
                    <TableCell>
                      {additionTypeLabels[addition.deductionType] || addition.deductionType}
                    </TableCell>
                    <TableCell>{addition.description}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +{formatCurrency(addition.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(addition.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold">Total Additions</TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    +{formatCurrency(totalAdditions)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}





