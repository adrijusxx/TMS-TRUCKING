'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
    Sparkles,
    Plus,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Building2,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OnboardingStats {
    counts: {
        customers: number;
        drivers: number;
        trucks: number;
        trailers: number;
        loads: number;
    };
    completion: {
        hasCustomers: boolean;
        hasDrivers: boolean;
        hasTrucks: boolean;
        hasTrailers: boolean;
        hasLoads: boolean;
    };
    recommendedStep: string | null;
    progressPercent: number;
    isComplete: boolean;
}

interface ImportStep {
    id: string;
    title: string;
    description: string;
    whyItMatters: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    addHref: string;
    color: string;
    bgColor: string;
    borderColor: string;
    countKey: keyof OnboardingStats['counts'];
    completionKey: keyof OnboardingStats['completion'];
}

const IMPORT_STEPS: ImportStep[] = [
    {
        id: 'customers',
        title: 'Customers (Brokers)',
        description: 'Your broker contacts',
        whyItMatters: 'Required to assign loads to brokers',
        icon: Building2,
        href: '/dashboard/customers',
        addHref: '/dashboard/customers?action=new',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        countKey: 'customers',
        completionKey: 'hasCustomers',
    },
    {
        id: 'drivers',
        title: 'Drivers',
        description: 'Your driver roster',
        whyItMatters: 'Required to dispatch loads',
        icon: Users,
        href: '/dashboard/fleet?tab=drivers',
        addHref: '/dashboard/fleet?tab=drivers&action=new',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        countKey: 'drivers',
        completionKey: 'hasDrivers',
    },
    {
        id: 'trucks',
        title: 'Trucks',
        description: 'Fleet vehicles',
        whyItMatters: 'Required to assign equipment to loads',
        icon: Truck,
        href: '/dashboard/fleet?tab=trucks',
        addHref: '/dashboard/fleet?tab=trucks&action=new',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        countKey: 'trucks',
        completionKey: 'hasTrucks',
    },
    {
        id: 'trailers',
        title: 'Trailers',
        description: 'Trailer equipment',
        whyItMatters: 'Optional but recommended for tracking',
        icon: Package,
        href: '/dashboard/fleet?tab=trailers',
        addHref: '/dashboard/fleet?tab=trailers&action=new',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        countKey: 'trailers',
        completionKey: 'hasTrailers',
    },
    {
        id: 'loads',
        title: 'Loads',
        description: 'Your freight/shipments',
        whyItMatters: 'Add loads after fleet is set up',
        icon: FileText,
        href: '/dashboard/loads',
        addHref: '/dashboard/loads?action=new',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        countKey: 'loads',
        completionKey: 'hasLoads',
    },
];

const STORAGE_KEY = 'tms_import_tutorial_dismissed';

export function ImportTutorial() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isDismissed, setIsDismissed] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [stats, setStats] = useState<OnboardingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch real-time stats from API
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/onboarding/stats');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setStats(data.data);
                        // Auto-dismiss if setup is complete
                        if (data.data.isComplete) {
                            setIsMinimized(true);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch onboarding stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) {
            fetchStats();
            // Refresh stats every 30 seconds
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    // Check localStorage for dismissed state
    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            setIsDismissed(false);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsDismissed(true);
    };

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    // Don't render if dismissed or no session
    if (isDismissed || !session?.user) {
        return null;
    }

    const progress = stats?.progressPercent ?? 0;
    const completedCount = stats ? Object.values(stats.completion).filter(Boolean).length : 0;

    // Minimized view - compact floating badge
    if (isMinimized) {
        return (
            <div
                className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-purple-500/30 rounded-lg p-3 shadow-lg cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={handleMinimize}
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-white font-medium">Setup Guide</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">({completedCount}/5)</span>
                        {stats?.isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[340px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-purple-400" />
                        <h3 className="font-semibold text-white">Get Started</h3>
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
                    Set up your TMS in 5 easy steps
                </p>

                {/* Progress bar with percentage */}
                <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{completedCount} of 5 complete</span>
                        <span className="text-purple-400 font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="p-3 space-y-1.5 max-h-[320px] overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                    </div>
                ) : (
                    IMPORT_STEPS.map((step, index) => {
                        const isCompleted = stats?.completion[step.completionKey] ?? false;
                        const count = stats?.counts[step.countKey] ?? 0;
                        const isRecommended = stats?.recommendedStep === step.id;
                        const Icon = step.icon;

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "rounded-lg border transition-all p-2.5",
                                    isCompleted
                                        ? "border-green-500/30 bg-green-500/5"
                                        : isRecommended
                                            ? `${step.borderColor} ${step.bgColor} ring-1 ring-purple-500/30`
                                            : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Step number / Check */}
                                    <div className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                        isCompleted ? "bg-green-500/20" : step.bgColor
                                    )}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                                        ) : (
                                            <Icon className={cn("h-4 w-4", step.color)} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-slate-500 font-medium">{index + 1}.</span>
                                            <span className={cn(
                                                "text-sm font-medium",
                                                isCompleted ? "text-green-400" : "text-white"
                                            )}>
                                                {step.title}
                                            </span>
                                            {isRecommended && !isCompleted && (
                                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-medium">
                                                    NEXT
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {isCompleted ? (
                                                <span className="text-green-400/80">{count} added</span>
                                            ) : (
                                                step.whyItMatters
                                            )}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!isCompleted && (
                                            <>
                                                <Link href={step.addHref}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
                                                        title="Add new"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Link href={step.href}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
                                                        title="Import CSV"
                                                    >
                                                        <Upload className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </>
                                        )}
                                        {isCompleted && (
                                            <Link href={step.href}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
                                                    title="View"
                                                >
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Tips section - collapsible */}
            <div className="border-t border-slate-700/50">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                    <span className="flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Pro Tips
                    </span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {isExpanded && (
                    <div className="px-3 pb-3 space-y-1.5">
                        <p className="text-xs text-slate-500">
                            <span className="text-purple-400">•</span> Import in order shown for best results
                        </p>
                        <p className="text-xs text-slate-500">
                            <span className="text-blue-400">•</span> CSV files should have headers matching field names
                        </p>
                        <p className="text-xs text-slate-500">
                            <span className="text-green-400">•</span> You can always add more data later from each section
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-slate-400 hover:text-white"
                    onClick={handleDismiss}
                >
                    I'll set up later
                </Button>
            </div>
        </div>
    );
}
