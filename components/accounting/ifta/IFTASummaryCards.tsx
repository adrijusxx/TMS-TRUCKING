'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Route, Fuel, Gauge, Truck, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IFTASummaryCardsProps {
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  loadsIncluded: number;
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
}

export function IFTASummaryCards({
  totalMiles,
  totalGallons,
  mpg,
  loadsIncluded,
  totalTaxDue,
  totalTaxPaid,
  netTaxDue,
}: IFTASummaryCardsProps) {
  const isCredit = netTaxDue < 0;

  const cards = [
    {
      label: 'Total Miles',
      value: totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 }),
      icon: Route,
    },
    {
      label: 'Total Gallons',
      value: totalGallons.toLocaleString(undefined, { maximumFractionDigits: 1 }),
      icon: Fuel,
    },
    {
      label: 'Fleet MPG',
      value: mpg.toFixed(2),
      icon: Gauge,
    },
    {
      label: 'Loads Included',
      value: loadsIncluded.toLocaleString(),
      icon: Truck,
    },
    {
      label: 'Tax Due',
      value: formatCurrency(totalTaxDue),
      icon: DollarSign,
    },
    {
      label: 'Tax Paid',
      value: formatCurrency(totalTaxPaid),
      icon: DollarSign,
      className: 'text-green-600',
    },
    {
      label: isCredit ? 'Net Credit' : 'Net Tax Owed',
      value: formatCurrency(Math.abs(netTaxDue)),
      icon: DollarSign,
      className: isCredit ? 'text-green-600' : 'text-red-600',
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={cn(card.highlight && (isCredit ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <card.icon className="h-3.5 w-3.5" />
              {card.label}
            </div>
            <p className={cn('text-lg font-semibold', card.className)}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
