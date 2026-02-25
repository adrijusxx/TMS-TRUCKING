'use client';

import { PageTransition } from '@/components/ui/page-transition';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { StatCard } from '@/components/layout/StatCard';
import type { StatCardProps } from '@/components/layout/StatCard';

interface PageShellProps {
  /** Page title rendered as h1 */
  title?: string;
  /** Subtitle below the title */
  description?: string;
  /** KPI stat cards rendered in a responsive grid */
  stats?: StatCardProps[];
  /** Action buttons rendered to the right of the title */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Unified page wrapper providing consistent header, stats, transitions,
 * and spacing across all dashboard pages.
 *
 * The dashboard layout already handles sidebar, top nav, breadcrumbs,
 * and content padding — PageShell fills the remaining gap: page-level
 * header, KPI cards, and entrance animation.
 */
export function PageShell({
  title,
  description,
  stats,
  actions,
  children,
}: PageShellProps) {
  return (
    <PageTransition>
      <div className="space-y-3">
        {/* Actions bar */}
        {actions && (
          <div className="flex items-center justify-end gap-2">
            {actions}
          </div>
        )}

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
