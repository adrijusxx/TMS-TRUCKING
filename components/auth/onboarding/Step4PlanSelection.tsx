'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles, Truck, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES (inlined from removed onboarding.ts)
// =============================================================================

export type SubscriptionPlan = 'owner_operator' | 'trial';

export interface PlanSelectionInput {
    plan: SubscriptionPlan;
}

interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    description: string;
    features: string[];
    limitations?: string[];
    recommended?: boolean;
    badge?: string;
}

const PLAN_OPTIONS: PlanDetails[] = [
    {
        id: 'owner_operator',
        name: 'Free Tier',
        description: 'Get started with monthly usage limits',
        features: [
            '10 Loads per month',
            '5 Invoices per month',
            '3 Settlements per month',
            '1 Truck, 2 Drivers max',
            'Document AI (5 scans/mo)',
        ],
        limitations: [
            'Usage resets monthly',
            'Upgrade when you need more',
        ],
        badge: 'Free Tier',
    },
    {
        id: 'trial',
        name: '14-Day Pro Trial',
        description: 'Experience unlimited access to TMS Pro',
        features: [
            'Unlimited loads & invoices',
            'Unlimited trucks & drivers',
            'Full Accounting module',
            'Full Safety & Compliance',
            'AI-powered dispatch',
        ],
        limitations: [
            'Trial expires after 14 days',
            'Downgrades to Free Tier after trial',
        ],
        recommended: true,
        badge: 'Full Access',
    },
];

// =============================================================================
// COMPONENT
// =============================================================================

interface Step4PlanSelectionProps {
    onComplete: (data: PlanSelectionInput) => void;
    isLoading?: boolean;
}

export function Step4PlanSelection({ onComplete, isLoading }: Step4PlanSelectionProps) {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

    const handleSubmit = () => {
        if (selectedPlan) {
            onComplete({ plan: selectedPlan });
        }
    };

    return (
        <div>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
                </div>
                <p className="text-slate-400 text-sm">
                    Select the plan that works best for you
                </p>
            </div>

            {/* Plan Cards */}
            <div className="space-y-3 mb-6">
                {PLAN_OPTIONS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const Icon = plan.id === 'owner_operator' ? Truck : Star;

                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan.id)}
                            disabled={isLoading}
                            className={cn(
                                'w-full p-4 rounded-lg border-2 text-left transition-all relative overflow-hidden',
                                isSelected
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-slate-700 bg-slate-900 hover:border-slate-600',
                                plan.recommended && 'ring-1 ring-purple-500/30'
                            )}
                        >
                            {/* Recommended Badge */}
                            {plan.recommended && (
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-bl-lg">
                                    Recommended
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={cn(
                                    'p-2 rounded-lg',
                                    isSelected ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-white">{plan.name}</span>
                                        {plan.badge && (
                                            <span className={cn(
                                                'px-2 py-0.5 text-xs font-medium rounded-full',
                                                plan.id === 'owner_operator'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-purple-500/20 text-purple-400'
                                            )}>
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 mb-3">{plan.description}</p>

                                    {/* Features */}
                                    <div className="space-y-1.5">
                                        {plan.features.slice(0, 3).map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                                                <span className="text-slate-300">{feature}</span>
                                            </div>
                                        ))}
                                        {plan.features.length > 3 && (
                                            <div className="text-xs text-slate-500 pl-5">
                                                +{plan.features.length - 3} more features
                                            </div>
                                        )}
                                    </div>

                                    {/* Limitations */}
                                    {plan.limitations && plan.limitations.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                                            <div className="text-xs text-slate-500">
                                                {plan.limitations[0]}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Selection Indicator */}
                                <div className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                    isSelected
                                        ? 'border-purple-500 bg-purple-500'
                                        : 'border-slate-600'
                                )}>
                                    {isSelected && (
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Guarantee Box */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 mb-6">
                <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-300">
                        <span className="text-purple-400 font-medium">No credit card required.</span>
                        {' '}Start using TMS Pro immediately.
                    </span>
                </div>
            </div>

            {/* Submit Button */}
            <Button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 h-11 text-base"
                disabled={isLoading || !selectedPlan}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting Up Your Account...
                    </>
                ) : (
                    <>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </div>
    );
}
