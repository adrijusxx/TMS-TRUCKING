'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronDown, ChevronRight, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface RuleGroup {
  key: string;
  name: string;
  isAddition: boolean;
  deductionType: string;
  calculationType: string;
  amount: number | null;
  percentage: number | null;
  perMileRate: number | null;
  frequency: string;
  rules: any[];
  activeCount: number;
  pausedCount: number;
}

const frequencyLabel: Record<string, string> = {
  WEEKLY: 'Weekly', BIWEEKLY: 'Bi-Weekly', MONTHLY: 'Monthly', PER_SETTLEMENT: 'Per Settlement',
};

const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const calcDisplay = (rule: { calculationType: string; amount?: number | null; percentage?: number | null; perMileRate?: number | null }): string => {
  if (rule.calculationType === 'FIXED') return formatCurrency(rule.amount || 0);
  if (rule.calculationType === 'PERCENTAGE') return `${rule.percentage || 0}%`;
  if (rule.calculationType === 'PER_MILE') return `${formatCurrency(rule.perMileRate || 0)}/mi`;
  return '-';
};

interface ScheduledPaymentsTableProps {
  groups: RuleGroup[];
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (rule: any) => void;
}

export default function ScheduledPaymentsTable({
  groups, expandedGroups, toggleGroup, onToggleActive, onDelete, onEdit,
}: ScheduledPaymentsTableProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  return (
    <>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Drivers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No scheduled payments
                </TableCell>
              </TableRow>
            )}
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              return (
                <React.Fragment key={group.key}>
                  {/* Group header row */}
                  <TableRow
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <TableCell className="px-3">
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <Badge variant={group.isAddition ? 'default' : 'secondary'}>
                        {group.isAddition ? 'Addition' : 'Deduction'}
                      </Badge>
                    </TableCell>
                    <TableCell>{typeLabel(group.deductionType)}</TableCell>
                    <TableCell>{calcDisplay(group)}</TableCell>
                    <TableCell>{frequencyLabel[group.frequency] || group.frequency}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.rules.length} driver{group.rules.length !== 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {group.activeCount > 0 && (
                          <Badge variant="default" className="text-xs">{group.activeCount} active</Badge>
                        )}
                        {group.pausedCount > 0 && (
                          <Badge variant="outline" className="text-xs">{group.pausedCount} paused</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell />
                  </TableRow>

                  {/* Expanded driver rows */}
                  {isExpanded && group.rules.map((rule: any) => (
                    <TableRow key={rule.id} className={`bg-muted/10 ${!rule.isActive ? 'opacity-50' : ''}`}>
                      <TableCell />
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        {rule.driverName || 'MC-Wide'}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-sm">
                        {rule.goalAmount
                          ? `${formatCurrency(rule.currentAmount || 0)} / ${formatCurrency(rule.goalAmount)}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? 'default' : 'outline'} className="text-xs">
                          {rule.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); onEdit(rule); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); onToggleActive(rule.id, rule.isActive); }}
                          >
                            {rule.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(rule.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { onDelete(deleteTarget); setDeleteTarget(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
