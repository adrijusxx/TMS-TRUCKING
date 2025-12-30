
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, Package, Loader2, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getSubscriptionDetails } from '@/app/actions/subscription';
import { MODULE_NAMES, MODULE_DESCRIPTIONS, MODULE_PRICES, ALL_ACCESS_PLANS, SUBSCRIPTION_PLANS } from '@/lib/config/subscription-plans';
import { SubscriptionModule } from '@prisma/client';

// Convert Config to Array for rendering
const ADDON_MODULES: SubscriptionModule[] = ['FLEET', 'ACCOUNTING', 'SAFETY', 'HR', 'INTEGRATIONS', 'AI_DISPATCH', 'ANALYTICS'];



export default function BillingSubscriptionCategory() {
  const [loading, setLoading] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Fetch subscription details
    const fetchData = async () => {
      try {
        const details = await getSubscriptionDetails();
        setPlanDetails(details);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();

    // Show success message if redirected back from Stripe
    if (searchParams.get('success')) {
      toast.success("Subscription updated! Features unlocked.");
    }
  }, [searchParams]);

  const isAllAccess = planDetails && ALL_ACCESS_PLANS.includes(planDetails.planId);
  const isProMonthly = planDetails?.planId === SUBSCRIPTION_PLANS.PRO;
  const isEnterprise = planDetails?.planId === SUBSCRIPTION_PLANS.ENTERPRISE;

  const getPlanName = () => {
    if (isEnterprise) return 'Enterprise';
    if (isProMonthly) return 'Pro Monthly';
    if (planDetails?.planId === SUBSCRIPTION_PLANS.FREE) return 'Starter Free';
    return planDetails?.planId || 'Unknown Plan';
  };

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

        {!dataLoading && planDetails && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-primary mb-1">Current Plan</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {getPlanName()}
                {isAllAccess && <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0"><Crown className="w-3 h-3 mr-1" /> All Access</Badge>}
              </div>
            </div>
            {/* Could add Manage Subscription button here linking to Stripe Portal */}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Core Plan (Always Included) */}
        {!isAllAccess && (
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
              </ul>
            </CardContent>
            <CardFooter>
              <Button disabled variant="outline" className="w-full">Active</Button>
            </CardFooter>
          </Card>
        )}

        {/* Add-ons List */}
        {ADDON_MODULES.map((moduleId) => {
          const isIncluded = isAllAccess || planDetails?.modules?.includes(moduleId);
          const price = MODULE_PRICES[moduleId];
          const name = MODULE_NAMES[moduleId];
          const desc = MODULE_DESCRIPTIONS[moduleId];

          return (
            <Card key={moduleId} className={`flex flex-col ${isIncluded ? 'border-green-500/20 bg-green-500/5' : ''}`}>
              <CardHeader>
                <CardTitle className="text-base flex justify-between items-start">
                  {name}
                  {isIncluded && <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>}
                </CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-2xl font-bold">
                  {isIncluded ? <span className="text-green-500 text-lg">Included</span> : (
                    <>{price}<span className="text-sm font-normal text-muted-foreground">/mo</span></>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {!isIncluded ? (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(moduleId)}
                    disabled={!!loading}
                  >
                    {loading === moduleId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upgrade
                  </Button>
                ) : (
                  <Button variant="ghost" disabled className="w-full text-green-500 font-medium">
                    <Check className="w-4 h-4 mr-2" /> Enabled
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          Secure payments powered by Stripe. You will be redirected to checkout.
        </p>
      </div>
    </div>
  );
}
