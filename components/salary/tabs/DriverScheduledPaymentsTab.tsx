'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import CreateScheduleDialog from './CreateScheduleDialog';
import ScheduledPaymentsTable, { type RuleGroup } from './ScheduledPaymentsTable';
import DeductionRuleForm from '@/components/drivers/DriverEditTabs/DeductionRuleForm';

type ScopeFilter = 'all' | 'driver' | 'global';

/** Strip auto-generated driver prefix from rule names */
const cleanName = (name: string) => name.replace(/^Driver\s+D-\d+\s*-\s*/i, '').trim();

export default function DriverScheduledPaymentsTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [scopeFilter, setScopeFilter] = React.useState<ScopeFilter>('all');
  const [showAdditions, setShowAdditions] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<any>(null);

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

  const scheduledRules = React.useMemo(() => {
    const recurring = allRules.filter((r: any) => {
      const freq = r.deductionFrequency || r.frequency;
      return freq && freq !== 'ONE_TIME';
    });
    if (scopeFilter === 'driver') return recurring.filter((r: any) => r.driverId);
    if (scopeFilter === 'global') return recurring.filter((r: any) => !r.driverId);
    return recurring;
  }, [allRules, scopeFilter]);

  const getDriverName = (rule: any) => {
    const driver = drivers.find((d: any) => d.id === rule.driverId);
    if (driver) return `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.trim();
    return rule.driverId ? 'Unknown' : 'All Drivers (MC-Wide)';
  };

  const groups = React.useMemo<RuleGroup[]>(() => {
    const map = new Map<string, RuleGroup>();
    for (const rule of scheduledRules) {
      const freq = rule.deductionFrequency || rule.frequency;
      const key = [rule.deductionType, rule.calculationType, rule.amount ?? '', rule.percentage ?? '',
        rule.perMileRate ?? '', freq, rule.isAddition].join('|');
      if (!map.has(key)) {
        map.set(key, {
          key, name: cleanName(rule.name), isAddition: rule.isAddition, deductionType: rule.deductionType,
          calculationType: rule.calculationType, amount: rule.amount, percentage: rule.percentage,
          perMileRate: rule.perMileRate, frequency: freq, rules: [], activeCount: 0, pausedCount: 0,
        });
      }
      const group = map.get(key)!;
      group.rules.push({ ...rule, driverName: getDriverName(rule) });
      if (rule.isActive) group.activeCount++; else group.pausedCount++;
    }
    return Array.from(map.values());
  }, [scheduledRules, drivers]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['deduction-rules-scheduled'] });

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(apiUrl(`/api/deduction-rules/${id}`), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(currentActive ? 'Payment paused' : 'Payment activated');
      invalidate();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/deduction-rules/${id}`), { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Failed'); }
      toast.success('Scheduled payment deleted');
      invalidate();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = async (data: any) => {
    if (!editingRule) return;
    try {
      const res = await fetch(apiUrl(`/api/deduction-rules/${editingRule.id}`), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Failed'); }
      toast.success('Rule updated');
      setEditingRule(null);
      invalidate();
    } catch (err: any) { toast.error(err.message); }
  };

  const filteredGroups = React.useMemo(
    () => groups.filter((g) => g.isAddition === showAdditions),
    [groups, showAdditions],
  );

  // Count rules by scope for tab badges
  const allRecurring = allRules.filter((r: any) => { const f = r.deductionFrequency || r.frequency; return f && f !== 'ONE_TIME'; });
  const driverCount = allRecurring.filter((r: any) => r.driverId).length;
  const globalCount = allRecurring.filter((r: any) => !r.driverId).length;
  const deductionCount = allRecurring.filter((r: any) => !r.isAddition).length;
  const additionCount = allRecurring.filter((r: any) => r.isAddition).length;

  if (isLoading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant={!showAdditions ? 'default' : 'outline'} size="sm" onClick={() => setShowAdditions(false)}>
              Deductions ({deductionCount})
            </Button>
            <Button variant={showAdditions ? 'default' : 'outline'} size="sm" onClick={() => setShowAdditions(true)}>
              Additions ({additionCount})
            </Button>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Schedule
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={scopeFilter === 'all' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setScopeFilter('all')}>
            All ({allRecurring.length})
          </Button>
          <Button variant={scopeFilter === 'driver' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setScopeFilter('driver')}>
            Driver-specific ({driverCount})
          </Button>
          <Button variant={scopeFilter === 'global' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setScopeFilter('global')}>
            Global ({globalCount})
          </Button>
        </div>
      </div>

      <CreateScheduleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} isAddition={showAdditions} />

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
              onSubmit={handleEdit}
              isPending={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <ScheduledPaymentsTable
        groups={filteredGroups}
        expandedGroups={expandedGroups}
        toggleGroup={toggleGroup}
        onToggleActive={toggleActive}
        onDelete={handleDelete}
        onEdit={setEditingRule}
      />
    </div>
  );
}
