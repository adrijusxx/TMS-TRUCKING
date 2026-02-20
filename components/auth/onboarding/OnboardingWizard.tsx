'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Step1AccountDetails } from './Step1AccountDetails';
import { Step2CompanyDetails } from './Step2CompanyDetails';
import { Step4PlanSelection } from './Step4PlanSelection';
import type { CompanyDetailsInput } from './Step2CompanyDetails';
import type { PlanSelectionInput } from './Step4PlanSelection';
import { Truck, ArrowLeft, Building2, User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiUrl, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

interface RegistrationData {
    step1?: Step1Data;
    step2?: CompanyDetailsInput;
}

const STEPS = [
    { label: 'Account', description: 'Your details', icon: User },
    { label: 'Company', description: 'Business info', icon: Building2 },
    { label: 'Plan', description: 'Get started', icon: CreditCard },
];

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

export function OnboardingWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [registrationData, setRegistrationData] = useState<RegistrationData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // -------------------------------------------------------------------------
    // STEP 1: Account Details
    // -------------------------------------------------------------------------
    const handleStep1Complete = useCallback((data: Step1Data) => {
        setRegistrationData(prev => ({ ...prev, step1: data }));
        setCurrentStep(2);
        setError(null);
    }, []);

    // -------------------------------------------------------------------------
    // STEP 2: Company Details
    // -------------------------------------------------------------------------
    const handleStep2Complete = useCallback((data: CompanyDetailsInput) => {
        setRegistrationData(prev => ({ ...prev, step2: data }));
        setCurrentStep(3);
        setError(null);
    }, []);

    // -------------------------------------------------------------------------
    // STEP 3: Plan Selection - CREATE THE ACCOUNT
    // -------------------------------------------------------------------------
    const handlePlanComplete = useCallback(async (data: PlanSelectionInput) => {
        if (!registrationData.step1 || !registrationData.step2) {
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
                    email: registrationData.step1.email,
                    password: registrationData.step1.password,
                    confirmPassword: registrationData.step1.confirmPassword,
                    firstName: registrationData.step1.firstName,
                    lastName: registrationData.step1.lastName,
                    // Step 2 data
                    companyName: registrationData.step2.companyName,
                    dotNumber: registrationData.step2.dotNumber,
                    mcNumber: registrationData.step2.mcNumber,
                    phone: registrationData.step2.phone,
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
    }, [registrationData, router]);

    // -------------------------------------------------------------------------
    // NAVIGATION
    // -------------------------------------------------------------------------
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            setError(null);
        }
    }, [currentStep]);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <div className="min-h-screen flex bg-slate-950 selection:bg-purple-500/30">
            {/* Left Panel - Progress */}
            <div className="hidden lg:flex lg:w-[480px] relative overflow-hidden flex-col p-12">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-slate-950 z-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-10%] left-[-20%] w-[80%] h-[80%] bg-indigo-600/20 blur-[120px] rounded-full"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-purple-600/20 blur-[100px] rounded-full"
                    />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40 z-0" />
                </div>

                <div className="relative z-10 flex-1 flex flex-col">
                    <Link href="/" className="flex items-center space-x-3 mb-16 inline-block">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                            <Truck className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">TMS Pro</span>
                    </Link>

                    <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                        Start your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">journey</span>
                    </h2>
                    <p className="text-slate-400 text-lg mb-12 font-light leading-relaxed max-w-sm">
                        Set up your workspace in just 3 quick steps and modernize your fleet operations.
                    </p>

                    {/* Custom vertical step display */}
                    <div className="space-y-8 mt-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-white/5 rounded-full" />
                        <motion.div
                            className="absolute left-[19px] top-6 w-[2px] bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"
                            initial={{ height: 0 }}
                            animate={{ height: `${(currentStep - 1) * 50}%` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />

                        {STEPS.map((step, index) => {
                            const stepNum = index + 1;
                            const isCompleted = stepNum < currentStep;
                            const isActive = stepNum === currentStep;
                            const StepIcon = step.icon;

                            return (
                                <motion.div
                                    key={index}
                                    className="flex items-start gap-5 relative z-10"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (index * 0.1) }}
                                >
                                    <div className={cn(
                                        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-500 shadow-lg border relative',
                                        isCompleted ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-purple-500/20' :
                                            isActive ? 'bg-white/10 text-white border-purple-500/50 backdrop-blur-md shadow-purple-500/10' :
                                                'bg-white/[0.02] text-slate-500 border-white/5'
                                    )}>
                                        {isCompleted ? '✓' : <StepIcon className="w-4 h-4" />}

                                        {/* Glow effect for active state */}
                                        {isActive && (
                                            <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-md -z-10" />
                                        )}
                                    </div>
                                    <div className="pt-2">
                                        <div className={cn(
                                            'font-semibold text-base transition-colors duration-300 tracking-wide',
                                            isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                                        )}>
                                            {step.label}
                                        </div>
                                        <div className={cn(
                                            "text-sm mt-1 transition-colors duration-300 font-light",
                                            isActive ? 'text-slate-400' : 'text-slate-600'
                                        )}>{step.description}</div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative z-10 mt-auto text-sm text-slate-500 font-medium">
                    <p>No credit card required for setup • Cancel anytime</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 bg-slate-950/50 backdrop-blur-xl border-l border-white/5 overflow-y-auto">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

                <div className="w-full max-w-lg relative z-10 py-10">
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-10 flex justify-center">
                        <Link href="/" className="flex items-center space-x-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                                <Truck className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white">TMS Pro</span>
                        </Link>
                    </div>

                    {/* Back Button */}
                    <div className="h-10 mb-6 flex items-center">
                        {currentStep > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="text-slate-400 hover:text-white hover:bg-white/5 -ml-3 transition-colors rounded-lg"
                                disabled={isSubmitting}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                <span className="font-medium">Back</span>
                            </Button>
                        )}
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                className="mb-8 p-4 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl border border-red-500/20"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step Content */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Step1AccountDetails
                                    onComplete={handleStep1Complete}
                                    isLoading={isSubmitting}
                                    defaultValues={registrationData.step1}
                                />
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Step2CompanyDetails
                                    onComplete={handleStep2Complete}
                                    isLoading={isSubmitting}
                                    defaultValues={registrationData.step2}
                                />
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Step4PlanSelection
                                    onComplete={handlePlanComplete}
                                    isLoading={isSubmitting}
                                />
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
