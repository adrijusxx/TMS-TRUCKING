'use client';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface DeductionTariffDialogProps {
  deductionRules: any[];
  driverId: string;
}

const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const frequencyLabel: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  PER_SETTLEMENT: 'Per Settlement',
  ONE_TIME: 'One Time',
};

const calcDisplay = (rule: any): string => {
  if (rule.calculationType === 'FIXED') return formatCurrency(rule.amount || 0);
  if (rule.calculationType === 'PERCENTAGE') return `${rule.percentage || 0}%`;
  if (rule.calculationType === 'PER_MILE') return `${formatCurrency(rule.perMileRate || 0)}/mi`;
  return '-';
};

export default function DeductionTariffDialog({ deductionRules, driverId }: DeductionTariffDialogProps) {
  const rules = deductionRules || [];
  const deductions = rules.filter((r) => !r.isAddition);
  const additions = rules.filter((r) => r.isAddition);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />Deduction tariff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deduction Tariff</DialogTitle>
        </DialogHeader>

        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No deduction rules configured for this driver.
          </p>
        ) : (
          <>
            {deductions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Deductions ({deductions.length})</h4>
                <RulesTable rules={deductions} />
              </div>
            )}

            {additions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Additions ({additions.length})</h4>
                <RulesTable rules={additions} />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Link href={`/dashboard/drivers/${driverId}?tab=payroll`}>
            <Button variant="outline" size="sm">Manage Rules</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RulesTable({ rules }: { rules: any[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Goal / Current</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">{rule.name}</TableCell>
              <TableCell>{typeLabel(rule.deductionType)}</TableCell>
              <TableCell>{calcDisplay(rule)}</TableCell>
              <TableCell>{frequencyLabel[rule.frequency] || rule.frequency}</TableCell>
              <TableCell>
                {rule.goalAmount
                  ? `${formatCurrency(rule.currentAmount || 0)} / ${formatCurrency(rule.goalAmount)}`
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={rule.isActive ? 'default' : 'outline'}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
