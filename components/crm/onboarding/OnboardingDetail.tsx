'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import OnboardingProgressBar from './OnboardingProgressBar';
import OnboardingStepItem from './OnboardingStepItem';

interface OnboardingDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checklistId: string | null;
}

const statusColors: Record<string, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

export default function OnboardingDetail({ open, onOpenChange, checklistId }: OnboardingDetailProps) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['onboarding-detail', checklistId],
        queryFn: async () => {
            const res = await fetch(`/api/crm/onboarding/${checklistId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        enabled: !!checklistId && open,
    });

    const checklist = data?.checklist;
    const driverName = checklist?.driver?.user
        ? `${checklist.driver.user.firstName} ${checklist.driver.user.lastName}`
        : checklist?.lead
            ? `${checklist.lead.firstName} ${checklist.lead.lastName}`
            : 'Unknown';

    const totalSteps = checklist?.steps?.length || 0;
    const completedSteps = checklist?.steps?.filter((s: any) => s.status === 'COMPLETED').length || 0;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const handleStepUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['onboarding-detail', checklistId] });
        queryClient.invalidateQueries({ queryKey: ['onboarding-list'] });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[550px] sm:max-w-[550px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Onboarding: {driverName}</SheetTitle>
                    <SheetDescription>
                        {checklist?.driver?.driverNumber && `Driver ${checklist.driver.driverNumber} — `}
                        Track onboarding progress and complete steps
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : checklist ? (
                    <div className="space-y-6 mt-6">
                        <div className="flex items-center justify-between">
                            <Badge className={statusColors[checklist.status] || ''}>
                                {checklist.status.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {completedSteps}/{totalSteps} steps
                            </span>
                        </div>

                        <OnboardingProgressBar progress={progress} />

                        <div className="space-y-2">
                            {checklist.steps.map((step: any) => (
                                <OnboardingStepItem
                                    key={step.id}
                                    step={step}
                                    checklistId={checklist.id}
                                    onUpdate={handleStepUpdate}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-12">Checklist not found</p>
                )}
            </SheetContent>
        </Sheet>
    );
}
