
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, Package, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Pricing config based on user request
const ADDONS = [
  { id: 'FLEET', name: 'Fleet Department', price: 200, description: 'Maintenance, Inventory, Cost Tracking' },
  { id: 'ACCOUNTING', name: 'Accounting Department', price: 300, description: 'Settlements, Invoices, Expenses' },
  { id: 'SAFETY', name: 'Safety Department', price: 200, description: 'Compliance, Incidents, Training' },
  { id: 'HR', name: 'HR & Reports', price: 100, description: 'Payroll, Performance, Full Reporting' },
];

export default function BillingSubscriptionCategory() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show success message if redirected back from Stripe
    if (searchParams.get('success')) {
      toast.success("Subscription updated! Features unlocked.");
    }
  }, [searchParams]);

  const handleSubscribe = async (module: string) => {
    try {
      setLoading(module);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module }),
      });

      if (!res.ok) throw new Error('Failed to start checkout');

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Core Plan (Free) */}
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle>Core TMS</CardTitle>
            <CardDescription>Included Forever</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Load Management</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Load Board</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Basic Analytics</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Truck/Trailer List (View Only)</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Driver List (View Only)</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button disabled variant="outline" className="w-full">Active</Button>
          </CardFooter>
        </Card>

        {/* Add-ons List */}
        {ADDONS.map((addon) => (
          <Card key={addon.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{addon.name}</CardTitle>
              <CardDescription>{addon.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-2xl font-bold">${addon.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(addon.id)}
                disabled={!!loading}
              >
                {loading === addon.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          Secure payments powered by Stripe. You will be redirected to checkout.
        </p>
      </div>
    </div>
  );
}
