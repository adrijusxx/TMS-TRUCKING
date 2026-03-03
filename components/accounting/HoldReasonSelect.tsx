'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BILLING_HOLD_REASONS,
  HOLD_REASON_CATEGORIES,
  type HoldReasonCategory,
} from '@/lib/config/billing-hold-reasons';

interface HoldReasonSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function HoldReasonSelect({
  value,
  onValueChange,
  placeholder = 'Select hold reason...',
  disabled,
}: HoldReasonSelectProps) {
  const categories = Object.keys(HOLD_REASON_CATEGORIES) as HoldReasonCategory[];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => {
          const reasons = BILLING_HOLD_REASONS.filter(
            (r) => r.category === category
          );
          if (reasons.length === 0) return null;

          return (
            <SelectGroup key={category}>
              <SelectLabel>{HOLD_REASON_CATEGORIES[category]}</SelectLabel>
              {reasons.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  <div className="flex flex-col">
                    <span>{reason.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
