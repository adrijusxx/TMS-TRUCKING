'use client';

import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentInstrumentBadgeProps {
  name: string;
  lastFour?: string | null;
  color?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function PaymentInstrumentBadge({
  name,
  lastFour,
  color,
  className,
  size = 'sm',
}: PaymentInstrumentBadgeProps) {
  const bgColor = color ? `${color}22` : undefined;
  const textColor = color ?? undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        !color && 'border-border bg-muted text-muted-foreground',
        className,
      )}
      style={
        color
          ? {
              backgroundColor: bgColor,
              borderColor: `${color}55`,
              color: textColor,
            }
          : undefined
      }
    >
      <CreditCard className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      <span className="max-w-[140px] truncate">{name}</span>
      {lastFour && <span className="opacity-70">···{lastFour}</span>}
    </span>
  );
}
