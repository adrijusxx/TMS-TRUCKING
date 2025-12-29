
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionModule } from '@prisma/client';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
    module: SubscriptionModule;
}

export function UpgradePrompt({ module }: UpgradePromptProps) {
    const moduleNames: Record<string, string> = {
        FLEET: 'Fleet Management',
        ACCOUNTING: 'Accounting & Finance',
        SAFETY: 'Safety & Compliance',
        INTEGRATIONS: 'Connect & Integrations',
        AI_DISPATCH: 'AI Dispatch',
        ANALYTICS: 'Analytics',
        ['HR' as any]: 'Human Resources',
    };

    const moduleDescriptions: Record<string, string> = {
        FLEET: 'Advanced fleet management, tracking, and maintenance tools.',
        ACCOUNTING: 'Complete financial suite including invoices, settlements, and QuickBooks sync.',
        SAFETY: 'Compliance tracking, driver files, and incident management.',
        INTEGRATIONS: 'Connect with Samsara, ELD providers, and external load boards.',
        AI_DISPATCH: 'AI-powered load optimization and automated dispatching.',
        ANALYTICS: 'Comprehensive reporting and business intelligence dashboards.',
        HR: 'Driver evaluations, performance tracking, and personnel management.',
    };

    const modulePrices: Record<string, string> = {
        FLEET: '$49/mo',
        ACCOUNTING: '$79/mo',
        SAFETY: '$39/mo',
        INTEGRATIONS: '$29/mo',
        AI_DISPATCH: '$99/mo',
        ANALYTICS: '$59/mo',
        HR: '$49/mo',
    };

    return (
        <Card className="max-w-md w-full text-center shadow-lg border-primary/20">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 w-fit">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Unlock {moduleNames[module]}</CardTitle>
                <CardDescription className="text-lg">
                    {moduleDescriptions[module]}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">
                    This premium feature is available as an add-on to your current plan.
                    Upgrade now to boost your efficiency.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span>Only {modulePrices[module]}/month</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button asChild size="lg" className="w-full">
                    <Link href="/dashboard/settings/billing">
                        View Upgrade Options
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
