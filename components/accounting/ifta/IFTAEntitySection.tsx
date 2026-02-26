'use client';

import { ReactNode } from 'react';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { IFTAStateTable } from './IFTAStateTable';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StateBreakdown {
  state: string;
  stateName: string;
  miles: number;
  taxableMiles: number;
  taxRate: number;
  taxDue: number;
  taxPaid: number;
  netTax: number;
}

interface IFTAEntitySectionProps {
  title: string;
  icon: ReactNode;
  totalMiles: number;
  loadsIncluded: number;
  stateBreakdown: StateBreakdown[];
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
  defaultOpen?: boolean;
}

export function IFTAEntitySection({
  title,
  icon,
  totalMiles,
  loadsIncluded,
  stateBreakdown,
  totalTaxDue,
  totalTaxPaid,
  netTaxDue,
  defaultOpen = false,
}: IFTAEntitySectionProps) {
  const isCredit = netTaxDue < 0;

  return (
    <CollapsibleSection
      title={title}
      icon={icon}
      badge={`${stateBreakdown.length} states`}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-sm text-muted-foreground">
          <span>{totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })} miles</span>
          <span>{loadsIncluded} load{loadsIncluded !== 1 ? 's' : ''}</span>
          <span>Tax Due: {formatCurrency(totalTaxDue)}</span>
          <span className="text-green-600">Tax Paid: {formatCurrency(totalTaxPaid)}</span>
          <span className={cn('font-medium', isCredit ? 'text-green-600' : 'text-red-600')}>
            Net: {isCredit ? `-${formatCurrency(Math.abs(netTaxDue))}` : formatCurrency(netTaxDue)}
          </span>
        </div>

        <IFTAStateTable
          stateBreakdown={stateBreakdown}
          totalTaxDue={totalTaxDue}
          totalTaxPaid={totalTaxPaid}
          netTaxDue={netTaxDue}
        />
      </div>
    </CollapsibleSection>
  );
}
