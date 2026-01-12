'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    Users,
    Truck,
    Package,
    FileText,
    ArrowRight,
    X,
    CheckCircle2,
    Upload,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const IMPORT_STEPS = [
    {
        id: 'customers',
        title: 'Customers (Brokers)',
        description: 'Import your broker/customer list first',
        icon: Users,
        href: '/dashboard/customers',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
    },
    {
        id: 'drivers',
        title: 'Drivers',
        description: 'Add your driver roster',
        icon: Users,
        href: '/dashboard/fleet?tab=drivers',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
    },
    {
        id: 'trucks',
        title: 'Trucks',
        description: 'Register your fleet vehicles',
        icon: Truck,
        href: '/dashboard/fleet?tab=trucks',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
    },
    {
        id: 'trailers',
        title: 'Trailers',
        description: 'Add trailer equipment',
        icon: Package,
        href: '/dashboard/fleet?tab=trailers',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
    },
    {
        id: 'loads',
        title: 'Loads',
        description: 'Import your active loads',
        icon: FileText,
        href: '/dashboard/loads',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
    },
];

const STORAGE_KEY = 'tms_import_tutorial_dismissed';
const COMPLETED_KEY = 'tms_import_completed_steps';

export function ImportTutorial() {
    const { data: session } = useSession();
    const [isDismissed, setIsDismissed] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        // Check if tutorial was dismissed
        const dismissed = localStorage.getItem(STORAGE_KEY);
        const completed = localStorage.getItem(COMPLETED_KEY);

        if (!dismissed) {
            setIsDismissed(false);
        }

        if (completed) {
            try {
                setCompletedSteps(JSON.parse(completed));
            } catch { }
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsDismissed(true);
    };

    const handleStepComplete = (stepId: string) => {
        const newCompleted = [...completedSteps, stepId];
        setCompletedSteps(newCompleted);
        localStorage.setItem(COMPLETED_KEY, JSON.stringify(newCompleted));
    };

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    // Don't render if dismissed or no session
    if (isDismissed || !session?.user) {
        return null;
    }

    const progress = (completedSteps.length / IMPORT_STEPS.length) * 100;

    // Minimized view
    if (isMinimized) {
        return (
            <div
                className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-purple-500/30 rounded-lg p-3 shadow-lg cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={handleMinimize}
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-white font-medium">Setup Guide</span>
                    <span className="text-xs text-slate-400">({completedSteps.length}/{IMPORT_STEPS.length})</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-purple-400" />
                        <h3 className="font-semibold text-white">Import Your Data</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-white"
                            onClick={handleMinimize}
                        >
                            <span className="text-xs">−</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-white"
                            onClick={handleDismiss}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                    Follow this sequence for best results
                </p>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                {IMPORT_STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const Icon = step.icon;

                    return (
                        <Link
                            key={step.id}
                            href={step.href}
                            onClick={() => handleStepComplete(step.id)}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg border transition-all group",
                                isCompleted
                                    ? "border-green-500/30 bg-green-500/5"
                                    : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                isCompleted ? "bg-green-500/20" : step.bgColor
                            )}>
                                {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                ) : (
                                    <Icon className={cn("h-4 w-4", step.color)} />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-500">{index + 1}.</span>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        isCompleted ? "text-green-400" : "text-white"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{step.description}</p>
                            </div>

                            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                        </Link>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-slate-400 hover:text-white"
                    onClick={handleDismiss}
                >
                    I'll do this later
                </Button>
            </div>
        </div>
    );
}
