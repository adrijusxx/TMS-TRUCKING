'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Step1AccountDetails } from './Step1AccountDetails';
import { Step2CompanyDetails } from './Step2CompanyDetails';
import { Step4PlanSelection } from './Step4PlanSelection';
import type {
    OnboardingStep2Input,
    OnboardingStep4Input,
} from '@/lib/validations/onboarding';
import { Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiUrl, cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface Step1Data {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface OnboardingData {
    step1?: Step1Data;
    step2?: OnboardingStep2Input;
    step3?: OnboardingStep4Input; // Plan selection is now step 3
}

const STEPS = [
    { label: 'Account', description: 'Your details' },
    { label: 'Company', description: 'Business info' },
    { label: 'Plan', description: 'Get started' },
];

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

export function OnboardingWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---------------------------------------------------------------------------
    // STEP 1: Account Details
    // ---------------------------------------------------------------------------
    const handleStep1Complete = useCallback((data: Step1Data) => {
        setOnboardingData(prev => ({ ...prev, step1: data }));
        setCurrentStep(2);
        setError(null);
    }, []);

    // ---------------------------------------------------------------------------
    // STEP 2: Company Details
    // ---------------------------------------------------------------------------
    const handleStep2Complete = useCallback((data: OnboardingStep2Input) => {
        setOnboardingData(prev => ({ ...prev, step2: data }));
        setCurrentStep(3); // Go directly to Plan selection
        setError(null);
    }, []);

    // ---------------------------------------------------------------------------
    // STEP 3: Plan Selection - CREATE THE ACCOUNT
    // ---------------------------------------------------------------------------
    const handlePlanComplete = useCallback(async (data: OnboardingStep4Input) => {
        if (!onboardingData.step1 || !onboardingData.step2) {
            setError('Missing required information. Please go back and complete all steps.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(apiUrl('/api/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Step 1 data
                    email: onboardingData.step1.email,
                    password: onboardingData.step1.password,
                    confirmPassword: onboardingData.step1.confirmPassword,
                    firstName: onboardingData.step1.firstName,
                    lastName: onboardingData.step1.lastName,
                    // Step 2 data
                    companyName: onboardingData.step2.companyName,
                    dotNumber: onboardingData.step2.dotNumber,
                    mcNumber: onboardingData.step2.mcNumber,
                    phone: onboardingData.step2.phone,
                    // Plan selection
                    plan: data.plan,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || 'Registration failed');
            }

            // Redirect to login with success message
            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    }, [onboardingData, router]);

    // ---------------------------------------------------------------------------
    // NAVIGATION
    // ---------------------------------------------------------------------------
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            setError(null);
        }
    }, [currentStep]);

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------
    return (
        <div className="min-h-screen flex bg-slate-950">
            {/* Left Panel - Progress */}
            <div className="hidden lg:flex lg:w-[420px] bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-950 p-8 flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

                <div className="relative z-10">
                    <Link href="/" className="flex items-center space-x-2 mb-10">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                            <Truck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">TMS Pro</span>
                    </Link>

                    <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
                    <p className="text-slate-400 text-sm mb-8">
                        Set up your account in just a few minutes
                    </p>

                    {/* Custom vertical step display */}
                    <div className="space-y-4">
                        {STEPS.map((step, index) => {
                            const stepNum = index + 1;
                            const isCompleted = stepNum < currentStep;
                            const isActive = stepNum === currentStep;

                            return (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                                        isCompleted ? 'bg-green-500 text-white' :
                                            isActive ? 'bg-purple-500 text-white' :
                                                'bg-slate-700 text-slate-400'
                                    )}>
                                        {isCompleted ? '✓' : stepNum}
                                    </div>
                                    <div>
                                        <div className={cn(
                                            'font-medium text-sm',
                                            isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                                        )}>
                                            {step.label}
                                        </div>
                                        <div className="text-xs text-slate-500">{step.description}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative z-10 mt-auto text-xs text-slate-500">
                    <p>No credit card required • Cancel anytime</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-6">
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                                <Truck className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">TMS Pro</span>
                        </Link>
                    </div>

                    {/* Back Button */}
                    {currentStep > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="mb-4 text-slate-400 hover:text-white -ml-2"
                            disabled={isSubmitting}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {/* Step Content */}
                    {currentStep === 1 && (
                        <Step1AccountDetails
                            onComplete={handleStep1Complete}
                            isLoading={isSubmitting}
                            defaultValues={onboardingData.step1}
                        />
                    )}

                    {currentStep === 2 && (
                        <Step2CompanyDetails
                            onComplete={handleStep2Complete}
                            isLoading={isSubmitting}
                            defaultValues={onboardingData.step2}
                        />
                    )}

                    {currentStep === 3 && (
                        <Step4PlanSelection
                            onComplete={handlePlanComplete}
                            isLoading={isSubmitting}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
