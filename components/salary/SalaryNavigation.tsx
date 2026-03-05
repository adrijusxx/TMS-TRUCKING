'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText, Users, BarChart3, Wallet, Clock, UserCheck, Plus, CreditCard, CalendarClock, HelpCircle,
} from 'lucide-react';

const SALARY_TABS = [
  { id: 'batches', label: 'Batches', icon: FileText },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'statements', label: 'All Settlements', icon: Users },
  { id: 'report', label: 'Reports', icon: BarChart3 },
  { id: 'balances', label: 'Balances', icon: Wallet },
  { id: 'dispatcher', label: 'Dispatcher Salary', icon: UserCheck },
  { id: 'charges', label: 'One time charges', icon: CreditCard },
  { id: 'scheduled', label: 'Scheduled payments', icon: CalendarClock },
  { id: 'help', label: 'Help', icon: HelpCircle },
] as const;

export type SalaryTabId = typeof SALARY_TABS[number]['id'];

const SALARY_PATHS = ['/dashboard/settlements', '/dashboard/accounting/salary'] as const;

interface SalaryNavigationProps {
  /** Override the active tab (e.g. 'batches' when on a batch detail page) */
  activeTab?: SalaryTabId;
  /** Hide the "Generate Settlement" button */
  hideGenerate?: boolean;
}

export default function SalaryNavigation({ activeTab: activeTabProp, hideGenerate }: SalaryNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use the same base path the user is currently on
  const basePath = SALARY_PATHS.find((p) => pathname.startsWith(p)) || SALARY_PATHS[0];

  // Determine which tab is active
  const isOnSalaryPage = SALARY_PATHS.some((p) => pathname === p || pathname === `${p}/`);
  const activeTab = activeTabProp ?? (isOnSalaryPage ? (searchParams.get('tab') as SalaryTabId) || 'batches' : undefined);

  return (
    <div className="flex items-center border-b border-border">
      <nav className="flex flex-1 gap-0 overflow-x-auto">
        {SALARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`${basePath}?tab=${tab.id}`}
              className={cn(
                'relative flex items-center h-10 px-4 border-b-2 border-transparent',
                'text-sm font-medium text-muted-foreground whitespace-nowrap',
                'hover:text-foreground/80 transition-colors',
                isActive && 'border-primary text-primary',
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {!hideGenerate && (
        <Link href="/dashboard/settlements/generate" className="shrink-0 ml-auto pl-4">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Generate Settlement
          </Button>
        </Link>
      )}
    </div>
  );
}

export { SALARY_TABS };
