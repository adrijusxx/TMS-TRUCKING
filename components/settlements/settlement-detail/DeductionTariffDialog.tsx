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

const scopeLabel = (rule: any): { label: string; variant: 'default' | 'secondary' | 'outline' } => {
  if (rule.driverId) return { label: 'Driver-specific', variant: 'default' };
  return { label: 'MC-Wide', variant: 'outline' };
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

  // Compute which global rules are overridden by driver-specific rules of the same type
  const driverSpecificTypes = new Set(
    rules.filter(r => r.driverId).map(r => r.deductionType)
  );
  const isOverridden = (rule: any) => !rule.driverId && driverSpecificTypes.has(rule.deductionType);

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
                <RulesTable rules={deductions} isOverridden={isOverridden} />
              </div>
            )}

            {additions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Additions ({additions.length})</h4>
                <RulesTable rules={additions} isOverridden={isOverridden} />
              </div>
            )}
          </>
        )}

        <div className="flex justify-between mt-4">
          <Link href="/dashboard/accounting/salary?tab=scheduled">
            <Button variant="outline" size="sm">MC-Wide Rules</Button>
          </Link>
          <Link href={`/dashboard/drivers/${driverId}?tab=payroll`}>
            <Button variant="outline" size="sm">Driver Rules</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RulesTable({ rules, isOverridden }: { rules: any[]; isOverridden: (rule: any) => boolean }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Goal / Current</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id} className={isOverridden(rule) ? 'opacity-50' : ''}>
              <TableCell className="font-medium">{rule.name}</TableCell>
              <TableCell>
                <Badge variant={scopeLabel(rule).variant}>
                  {scopeLabel(rule).label}
                </Badge>
              </TableCell>
              <TableCell>{typeLabel(rule.deductionType)}</TableCell>
              <TableCell>{calcDisplay(rule)}</TableCell>
              <TableCell>{frequencyLabel[rule.frequency] || rule.frequency}</TableCell>
              <TableCell>
                {rule.goalAmount
                  ? `${formatCurrency(rule.currentAmount || 0)} / ${formatCurrency(rule.goalAmount)}`
                  : '-'}
              </TableCell>
              <TableCell>
                {isOverridden(rule) ? (
                  <Badge variant="outline">Overridden</Badge>
                ) : (
                  <Badge variant={rule.isActive ? 'default' : 'outline'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
