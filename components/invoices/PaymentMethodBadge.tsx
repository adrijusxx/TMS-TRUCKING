'use client';

import { Badge } from '@/components/ui/badge';
import { PaymentMethod } from '@prisma/client';
import { CreditCard, Building2, Zap } from 'lucide-react';

interface PaymentMethodBadgeProps {
  method: PaymentMethod | null | undefined;
  className?: string;
}

const paymentMethodColors: Record<PaymentMethod, string> = {
  CHECK: 'bg-gray-100 text-gray-800 border-gray-200',
  WIRE: 'bg-blue-100 text-blue-800 border-blue-200',
  ACH: 'bg-green-100 text-green-800 border-green-200',
  CREDIT_CARD: 'bg-purple-100 text-purple-800 border-purple-200',
  CASH: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
  FACTOR: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  QUICK_PAY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CHECK: 'Check',
  WIRE: 'Wire',
  ACH: 'ACH',
  CREDIT_CARD: 'Credit Card',
  CASH: 'Cash',
  OTHER: 'Other',
  FACTOR: 'Factor',
  QUICK_PAY: 'Quick Pay',
};

const paymentMethodIcons: Record<PaymentMethod, typeof CreditCard> = {
  CHECK: CreditCard,
  WIRE: CreditCard,
  ACH: CreditCard,
  CREDIT_CARD: CreditCard,
  CASH: CreditCard,
  OTHER: CreditCard,
  FACTOR: Building2,
  QUICK_PAY: Zap,
};

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  if (!method) return null;

  const Icon = paymentMethodIcons[method];

  return (
    <Badge
      variant="outline"
      className={`${paymentMethodColors[method]} ${className || ''} flex items-center gap-1`}
    >
      <Icon className="h-3 w-3" />
      {paymentMethodLabels[method]}
    </Badge>
  );
}

export function formatPaymentMethod(method: PaymentMethod | null | undefined): string {
  if (!method) return '';
  return paymentMethodLabels[method];
}

