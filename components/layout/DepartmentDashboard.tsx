import { PageTransition } from '@/components/ui/page-transition';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { StatCard } from '@/components/layout/StatCard';
import type { StatCardProps } from '@/components/layout/StatCard';

interface DepartmentDashboardProps {
  title: string;
  description?: string;
  stats?: StatCardProps[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DepartmentDashboard({
  title,
  description,
  stats,
  actions,
  children,
}: DepartmentDashboardProps) {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>

        {/* KPI Stats */}
        {stats && stats.length > 0 && (
          <StaggerContainer className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.title}>
                <StatCard {...stat} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Main Content */}
        {children}
      </div>
    </PageTransition>
  );
}
