'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ----- Types -----

export interface ProfitabilityBadgeProps {
  /** Revenue amount — used with totalCosts to derive margin */
  revenue?: number;
  /** Total costs — used with revenue to derive margin */
  totalCosts?: number;
  /** Pre-computed margin percentage — takes precedence over revenue/totalCosts */
  marginPercent?: number;
  /** Optional className override */
  className?: string;
  /** Show the percentage value */
  showPercent?: boolean;
}

// ----- Helpers -----

type ProfitTier = 'unprofitable' | 'low' | 'marginal' | 'healthy';

interface TierConfig {
  label: string;
  variant: 'error' | 'warning' | 'warning-outline' | 'success';
  dotColor: string;
}

const TIER_MAP: Record<ProfitTier, TierConfig> = {
  unprofitable: {
    label: 'Unprofitable',
    variant: 'error',
    dotColor: 'bg-red-500',
  },
  low: {
    label: 'Low Margin',
    variant: 'warning',
    dotColor: 'bg-orange-500',
  },
  marginal: {
    label: 'Marginal',
    variant: 'warning-outline',
    dotColor: 'bg-yellow-500',
  },
  healthy: {
    label: 'Healthy',
    variant: 'success',
    dotColor: 'bg-green-500',
  },
};

function getTier(marginPercent: number): ProfitTier {
  if (marginPercent < 0) return 'unprofitable';
  if (marginPercent < 10) return 'low';
  if (marginPercent <= 15) return 'marginal';
  return 'healthy';
}

// ----- Component -----

export function ProfitabilityBadge({
  revenue,
  totalCosts,
  marginPercent: marginProp,
  className,
  showPercent = true,
}: ProfitabilityBadgeProps) {
  // Determine margin: prefer explicit marginPercent, else derive from revenue/totalCosts
  let margin: number;

  if (marginProp !== undefined) {
    margin = marginProp;
  } else if (revenue !== undefined && totalCosts !== undefined) {
    margin = revenue > 0 ? ((revenue - totalCosts) / revenue) * 100 : 0;
  } else {
    // Not enough data to render
    return null;
  }

  const tier = getTier(margin);
  const config = TIER_MAP[tier];

  return (
    <Badge
      variant={config.variant}
      size="sm"
      dot
      className={cn(className)}
    >
      {config.label}
      {showPercent && (
        <span className="ml-1 opacity-80">
          {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
        </span>
      )}
    </Badge>
  );
}
