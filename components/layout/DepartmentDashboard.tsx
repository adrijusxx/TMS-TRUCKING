import { PageShell } from '@/components/layout/PageShell';
import type { StatCardProps } from '@/components/layout/StatCard';

interface DepartmentDashboardProps {
  title: string;
  description?: string;
  stats?: StatCardProps[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Department-level page wrapper. Delegates to PageShell for
 * consistent header, stats, and transition behavior.
 */
export function DepartmentDashboard({
  title,
  description,
  stats,
  actions,
  children,
}: DepartmentDashboardProps) {
  return (
    <PageShell title={title} description={description} stats={stats} actions={actions}>
      {children}
    </PageShell>
  );
}
