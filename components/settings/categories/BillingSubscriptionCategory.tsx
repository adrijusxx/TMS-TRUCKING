'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Crown, Package, FileText, Receipt, Sparkles, CreditCard, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getSubscriptionDetails } from '@/app/actions/subscription';
import {
    MODULE_NAMES, MODULE_DESCRIPTIONS, MODULE_PRICES,
    ALL_ACCESS_PLANS, SUBSCRIPTION_PLANS, PREMIUM_MODULES,
} from '@/lib/config/subscription-plans';
import { SubscriptionModule } from '@prisma/client';
import { UsageMeter } from '@/components/subscription/UsageMeter';

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
        if (isProMonthly) return 'Pro';
        if (planDetails?.planId?.includes('trial')) return 'Pro Trial';
        if (planDetails?.planId === SUBSCRIPTION_PLANS.FREE) return 'Free';
        if (isFreeTier) return 'Free';
        return planDetails?.planId || 'Unknown';
    };

    const handleUpgradePro = async () => {
        try {
            setLoading('upgrade-pro');
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'upgrade-pro' }),
            });
            if (!res.ok) throw new Error('Failed to start checkout');
            const { url } = await res.json();
            window.location.href = url;
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const handleAddModule = async (module: SubscriptionModule) => {
        try {
            setLoading(module);
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add-module', module }),
            });
            if (!res.ok) throw new Error('Failed to start checkout');
            const { url } = await res.json();
            window.location.href = url;
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const handleManageBilling = async () => {
        try {
            setLoading('portal');
            const res = await fetch('/api/stripe/portal', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to open billing portal');
            const { url } = await res.json();
            window.location.href = url;
        } catch {
            toast.error('Could not open billing portal.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Billing & Subscription</h2>
                <p className="text-muted-foreground">
                    View your subscription plan, usage limits, and payment history. Upgrade your plan or add premium modules to unlock additional features. Billing is managed securely through Stripe.
                </p>

                {/* Current Plan Banner */}
                {!dataLoading && planDetails && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-primary mb-1">Current Plan</div>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                {getPlanName()}
                                {isAllAccess && (
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                                        <Crown className="w-3 h-3 mr-1" /> All Access
                                    </Badge>
                                )}
                                {isFreeTier && <Badge variant="outline">Free</Badge>}
                                {isProMonthly && <Badge variant="outline">$15/truck/mo</Badge>}
                            </div>
                        </div>
                        {/* Manage Billing button for paying subscribers */}
                        {(isProMonthly || isEnterprise) && (
                            <Button
                                variant="outline"
                                onClick={handleManageBilling}
                                disabled={loading === 'portal'}
                            >
                                {loading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <CreditCard className="mr-2 h-4 w-4" /> Manage Billing
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Usage Summary — Free Tier only */}
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
                            <UsageMeter label="Loads" used={usageSummary.loadsCreated} limit={usageSummary.loadsLimit} icon={<Package className="h-4 w-4" />} />
                            <UsageMeter label="Invoices" used={usageSummary.invoicesGenerated} limit={usageSummary.invoicesLimit} icon={<FileText className="h-4 w-4" />} />
                            <UsageMeter label="Settlements" used={usageSummary.settlementsGenerated} limit={usageSummary.settlementsLimit} icon={<Receipt className="h-4 w-4" />} />
                            <UsageMeter label="Doc Scans" used={usageSummary.documentsProcessed} limit={usageSummary.documentsLimit} icon={<FileText className="h-4 w-4" />} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Upgrade to Pro CTA — Free Tier only */}
            {!dataLoading && isFreeTier && (
                <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-purple-500" /> Upgrade to Pro
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong>$15/truck/month</strong> — Unlimited loads, invoices, settlements & documents. All core modules included.
                                </p>
                            </div>
                            <Button
                                onClick={handleUpgradePro}
                                disabled={loading === 'upgrade-pro'}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                            >
                                {loading === 'upgrade-pro' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upgrade Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Premium Add-ons */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Premium Add-ons</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {PREMIUM_MODULES.map((moduleId) => {
                        const isActive = planDetails?.modules?.includes(moduleId);
                        return (
                            <Card key={moduleId} className={isActive ? 'border-green-500/20 bg-green-500/5' : ''}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex justify-between items-start">
                                        {MODULE_NAMES[moduleId]}
                                        {isActive && (
                                            <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">{MODULE_DESCRIPTIONS[moduleId]}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <div className="text-xl font-bold">
                                        {isActive
                                            ? <span className="text-green-500 text-base">Enabled</span>
                                            : <>{MODULE_PRICES[moduleId]}</>
                                        }
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    {!isActive ? (
                                        <Button
                                            className="w-full" size="sm"
                                            onClick={() => handleAddModule(moduleId)}
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
            </div>

            {/* Core Modules (always included) */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Core Modules <Badge variant="outline" className="ml-2">Included in all plans</Badge></h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {(['FLEET', 'ACCOUNTING', 'SAFETY', 'HR', 'INTEGRATIONS'] as SubscriptionModule[]).map((moduleId) => (
                        <Card key={moduleId} className="border-green-500/10 bg-green-500/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    {MODULE_NAMES[moduleId]}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <p className="text-xs text-muted-foreground line-clamp-2">{MODULE_DESCRIPTIONS[moduleId]}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                    Secure payments powered by Stripe. You will be redirected to checkout.
                </p>
            </div>
        </div>
    );
}
