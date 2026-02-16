'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImportPage from '@/components/import-export/ImportPage';
import { getEntityConfig } from '@/lib/import-export/entity-config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Truck, User, Users, Package, ArrowRight, Building2, Box } from 'lucide-react'; // Replaced Container with Box for safety
import { Progress } from '@/components/ui/progress';

type Step = 'welcome' | 'drivers' | 'trucks' | 'trailers' | 'customers' | 'loads' | 'complete';

const STEPS: { id: Step; label: string; icon: any }[] = [
    { id: 'welcome', label: 'Start', icon: Building2 },
    { id: 'drivers', label: 'Drivers', icon: User },
    { id: 'trucks', label: 'Trucks', icon: Truck },
    { id: 'trailers', label: 'Trailers', icon: Box }, // Changed to Box
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'loads', label: 'Loads', icon: Package },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [completedSteps, setCompletedSteps] = useState<Step[]>([]);

    const handleNext = (skip = false) => {
        const currentIndex = STEPS.findIndex(s => s.id === currentStep);
        if (!skip) {
            setCompletedSteps(prev => [...prev, currentStep]);
        }

        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1].id);
        } else {
            setCurrentStep('complete');
        }
    };

    const handleBack = () => {
        const currentIndex = STEPS.findIndex(s => s.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id);
        }
    };

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
    const progress = Math.round(((currentStepIndex) / (STEPS.length - 1)) * 100);

    const renderImportStep = (entityType: string) => {
        const config = getEntityConfig(entityType);
        if (!config) return <div>Configuration not found for {entityType}</div>;

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Import {config.label}</h2>
                        <p className="text-muted-foreground text-sm">Upload your {config.label.toLowerCase()} list to get started.</p>
                    </div>
                    <Button variant="ghost" onClick={() => handleNext(true)}>Skip {config.label}</Button>
                </div>

                <ImportPage
                    entityType={entityType}
                    entityLabel={config.label}
                    systemFields={config.fields}
                    backUrl="" // Handled by onBack
                    onBack={handleBack}
                    onComplete={() => handleNext(false)}
                    exampleFileUrl={config.exampleFileUrl}
                    hideHeader={true}
                />
            </div>
        );
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Welcome to TMS Onboarding</h1>
                <p className="text-muted-foreground">Setup your fleet, drivers, and customers to get started.</p>
            </div>

            {/* Progress */}
            <div className="mb-8">
                <Progress value={currentStep === 'complete' ? 100 : progress} className="h-2 mb-4" />
                <div className="flex justify-between relative px-2">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = completedSteps.includes(step.id);
                        const isFuture = !isActive && !isCompleted;

                        return (
                            <div key={step.id} className="flex flex-col items-center z-10">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 bg-background
                                ${isActive ? 'border-primary text-primary' :
                                            isCompleted ? 'border-green-500 bg-green-50 text-green-600' : 'border-muted text-muted-foreground'}
                            `}
                                >
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Card className="w-full">
                <CardContent className="p-6">
                    {currentStep === 'welcome' && (
                        <div className="text-center py-8 space-y-6">
                            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                                <Building2 className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Company Setup</h2>
                                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                                    Before we begin, please ensure your company details (DOT, MC Number) are correct in Settings.
                                    Then we'll guide you through importing your operational data.
                                </p>
                            </div>

                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
                                    Check Settings
                                </Button>
                                <Button size="lg" onClick={() => handleNext()}>
                                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'drivers' && renderImportStep('drivers')}
                    {currentStep === 'trucks' && renderImportStep('trucks')}
                    {currentStep === 'trailers' && renderImportStep('trailers')}
                    {currentStep === 'customers' && renderImportStep('customers')}
                    {currentStep === 'loads' && renderImportStep('loads')}

                    {currentStep === 'complete' && (
                        <div className="text-center py-12 space-y-6">
                            <div className="bg-green-100 dark:bg-green-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold">You're all set!</h2>
                            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                                Your data has been imported successfully. You can always import more data later from the specific pages or the Import Center.
                            </p>
                            <Button size="lg" onClick={() => router.push('/dashboard')}>
                                Go to Dashboard
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {currentStep !== 'welcome' && currentStep !== 'complete' && (
                <div className="text-center mt-4">
                    <span className="text-sm text-muted-foreground">
                        Need help? <a href="/help" className="text-primary hover:underline">View the documentation</a> or contact support.
                    </span>
                </div>
            )}
        </div>
    );
}
