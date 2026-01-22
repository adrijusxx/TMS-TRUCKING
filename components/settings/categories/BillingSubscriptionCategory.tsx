
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Crown, Package, FileText, Receipt, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getSubscriptionDetails } from '@/app/actions/subscription';
import { MODULE_NAMES, MODULE_DESCRIPTIONS, MODULE_PRICES, ALL_ACCESS_PLANS, SUBSCRIPTION_PLANS } from '@/lib/config/subscription-plans';
import { SubscriptionModule } from '@prisma/client';
import { UsageMeter } from '@/components/subscription/UsageMeter';

// Convert Config to Array for rendering
const ADDON_MODULES: SubscriptionModule[] = ['FLEET', 'ACCOUNTING', 'SAFETY', 'HR', 'INTEGRATIONS', 'AI_DISPATCH', 'ANALYTICS'];

interface UsageSummary {
  periodStart: string;
  periodEnd: string;
  loadsCreated: number;
  loadsLimit: number | null;
  invoicesGenerated: number;
  invoicesLimit: number | null;
  settlementsGenerated: number;
  settlementsLimit: number | null;
  documentsProcessed: number;
  documentsLimit: number | null;
  isFreeTier: boolean;
}

export default function BillingSubscriptionCategory() {
  const [loading, setLoading] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [details, usageRes] = await Promise.all([
          getSubscriptionDetails(),
          fetch('/api/usage/summary').then(r => r.ok ? r.json() : null),
        ]);
        setPlanDetails(details);
        setUsageSummary(usageRes);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();

    if (searchParams.get('success')) {
      toast.success("Subscription updated! Features unlocked.");
    }
  }, [searchParams]);

  const isAllAccess = planDetails && ALL_ACCESS_PLANS.includes(planDetails.planId);
  const isProMonthly = planDetails?.planId === SUBSCRIPTION_PLANS.PRO;
  const isEnterprise = planDetails?.planId === SUBSCRIPTION_PLANS.ENTERPRISE;
  const isFreeTier = usageSummary?.isFreeTier || (!isAllAccess && !isProMonthly && !isEnterprise);

  const getPlanName = () => {
    if (isEnterprise) return 'Enterprise';
    if (isProMonthly) return 'Pro Monthly';
    if (planDetails?.planId === SUBSCRIPTION_PLANS.FREE) return 'Starter Free';
    if (isFreeTier) return 'Free Tier';
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
                {isFreeTier && <Badge variant="outline">Usage-Based</Badge>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Summary Card - Only for Free Tier */}
      {!dataLoading && usageSummary && isFreeTier && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Monthly Usage
            </CardTitle>
            <CardDescription>
              Resets on {new Date(usageSummary.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <UsageMeter
                label="Loads"
                used={usageSummary.loadsCreated}
                limit={usageSummary.loadsLimit}
                icon={<Package className="h-4 w-4" />}
              />
              <UsageMeter
                label="Invoices"
                used={usageSummary.invoicesGenerated}
                limit={usageSummary.invoicesLimit}
                icon={<FileText className="h-4 w-4" />}
              />
              <UsageMeter
                label="Settlements"
                used={usageSummary.settlementsGenerated}
                limit={usageSummary.settlementsLimit}
                icon={<Receipt className="h-4 w-4" />}
              />
              <UsageMeter
                label="Doc Scans"
                used={usageSummary.documentsProcessed}
                limit={usageSummary.documentsLimit}
                icon={<FileText className="h-4 w-4" />}
              />
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button onClick={() => handleSubscribe('PRO')} className="w-full" disabled={!!loading}>
                {loading === 'PRO' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade to Pro for Unlimited Usage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Core Plan (Always Included) */}
        {!isAllAccess && (
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Free Tier</CardTitle>
              <CardDescription>Usage-based limits</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold mb-3">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-1.5 text-sm">
                <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 10 Loads/month</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 5 Invoices/month</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 3 Settlements/month</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Truck, 2 Drivers</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button disabled variant="outline" className="w-full">Current Plan</Button>
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
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-start">
                  {name}
                  {isIncluded && <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>}
                </CardTitle>
                <CardDescription className="line-clamp-2">{desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <div className="text-xl font-bold">
                  {isIncluded ? <span className="text-green-500 text-base">Included</span> : (
                    <>{price}<span className="text-sm font-normal text-muted-foreground">/mo</span></>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {!isIncluded ? (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleSubscribe(moduleId)}
                    disabled={!!loading}
                  >
                    {loading === moduleId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Module
                  </Button>
                ) : (
                  <Button variant="ghost" disabled size="sm" className="w-full text-green-500 font-medium">
                    <Check className="w-4 h-4 mr-2" /> Enabled
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted p-3 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          Secure payments powered by Stripe. You will be redirected to checkout.
        </p>
      </div>
    </div>
  );
}
