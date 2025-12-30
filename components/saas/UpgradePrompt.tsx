
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionModule } from '@prisma/client';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { MODULE_NAMES, MODULE_DESCRIPTIONS, MODULE_PRICES } from '@/lib/config/subscription-plans';

interface UpgradePromptProps {
    module: SubscriptionModule;
}

export function UpgradePrompt({ module }: UpgradePromptProps) {
    // Use centralized configuration for consistency
    const moduleNames = MODULE_NAMES;
    const moduleDescriptions = MODULE_DESCRIPTIONS;
    const modulePrices = MODULE_PRICES;

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
