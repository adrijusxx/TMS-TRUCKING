'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DEPARTMENTS = [
  'OPERATIONS', 'FLEET', 'RECRUITING', 'DISPATCH',
  'SAFETY', 'ACCOUNTING', 'ADMIN', 'OTHER',
] as const;

const DEPARTMENT_LABELS: Record<string, string> = {
  OPERATIONS: 'Operations',
  FLEET: 'Fleet',
  RECRUITING: 'Recruiting',
  DISPATCH: 'Dispatch',
  SAFETY: 'Safety',
  ACCOUNTING: 'Accounting',
  ADMIN: 'Admin',
  OTHER: 'Other',
};

interface BudgetEntry {
  id: string;
  department: string;
  month: number;
  year: number;
  budgetAmount: number;
  actual: number;
  remaining: number;
  utilizationPct: number;
}

export function DepartmentBudgetManager() {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Record<string, string>>({});

  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<BudgetEntry[]>({
    queryKey: ['department-budgets', year, month],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/department-budgets?year=${year}&month=${month}`));
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json.data as BudgetEntry[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (entries.length > 0) {
      const initial: Record<string, string> = {};
      entries.forEach((e: BudgetEntry) => {
        initial[e.department] = String(e.budgetAmount);
      });
      setBudgets(initial);
    }
  }, [entries]);

  const saveMutation = useMutation({
    mutationFn: async ({ department, amount }: { department: string; amount: number }) => {
      const res = await fetch(apiUrl('/api/department-budgets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department, month, year, budgetAmount: amount }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['department-budgets'] });
      qc.invalidateQueries({ queryKey: ['company-expenses-summary'] });
    },
    onError: () => toast.error('Failed to save budget'),
  });

  const saveAll = async () => {
    const promises = Object.entries(budgets)
      .filter(([, v]) => v && !isNaN(parseFloat(v)))
      .map(([department, amount]) =>
        saveMutation.mutateAsync({ department, amount: parseFloat(amount) }),
      );
    await Promise.all(promises);
    toast.success('Budgets saved');
  };

  const budgetMap = Object.fromEntries(entries.map((e) => [e.department, e]));

  const monthName = format(new Date(year, month - 1), 'MMMM yyyy');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Budgets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Department Budgets — {monthName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const d = new Date(year, month - 2);
              setMonth(d.getMonth() + 1);
              setYear(d.getFullYear());
            }}
          >
            ←
          </Button>
          <span className="font-medium w-32 text-center">{monthName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const d = new Date(year, month);
              setMonth(d.getMonth() + 1);
              setYear(d.getFullYear());
            }}
          >
            →
          </Button>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {DEPARTMENTS.map((dept) => {
              const entry = budgetMap[dept];
              const budgetVal = budgets[dept] ?? (entry ? String(entry.budgetAmount) : '');
              const actual = entry?.actual ?? 0;
              const budget = parseFloat(budgetVal) || 0;
              const pct = budget > 0 ? Math.min(Math.round((actual / budget) * 100), 100) : 0;
              const overBudget = budget > 0 && actual > budget;

              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium w-28 shrink-0">
                      {DEPARTMENT_LABELS[dept]}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground w-20 shrink-0 text-right">
                        {formatCurrency(actual)}
                      </span>
                      <span className="text-xs text-muted-foreground">/</span>
                      <div className="relative flex-1 max-w-[120px]">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={budgetVal}
                          onChange={(e) => setBudgets((b) => ({ ...b, [dept]: e.target.value }))}
                          className="h-7 text-xs pl-5 pr-2"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  {budget > 0 && (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={pct}
                        className={`h-1.5 flex-1 ${overBudget ? '[&>div]:bg-red-500' : ''}`}
                      />
                      <span className={`text-xs w-8 text-right ${overBudget ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        {pct}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={saveAll} size="sm" className="gap-1.5" disabled={saveMutation.isPending}>
            <Save className="h-3.5 w-3.5" />
            Save Budgets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
