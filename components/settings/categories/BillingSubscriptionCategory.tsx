'use client';

import SubscriptionBilling from '@/components/settings/SubscriptionBilling';

export default function BillingSubscriptionCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing information
        </p>
      </div>

      <SubscriptionBilling />
    </div>
  );
}

