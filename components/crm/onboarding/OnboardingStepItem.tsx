'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Step {
    id: string;
    stepType: string;
    label: string;
    description?: string | null;
    required: boolean;
    status: string;
    notes?: string | null;
    completedAt?: string | null;
    completedBy?: { firstName: string; lastName: string } | null;
}

interface OnboardingStepItemProps {
    step: Step;
    checklistId: string;
    onUpdate: () => void;
}

const stepTypeColors: Record<string, string> = {
    DOCUMENT_UPLOAD: 'bg-blue-100 text-blue-700',
    FORM_COMPLETION: 'bg-purple-100 text-purple-700',
    BACKGROUND_CHECK: 'bg-amber-100 text-amber-700',
    DRUG_TEST: 'bg-red-100 text-red-700',
    MEDICAL_CARD: 'bg-pink-100 text-pink-700',
    MVR_CHECK: 'bg-orange-100 text-orange-700',
    EQUIPMENT_ASSIGNMENT: 'bg-teal-100 text-teal-700',
    TRAINING: 'bg-green-100 text-green-700',
    ORIENTATION: 'bg-indigo-100 text-indigo-700',
    POLICY_ACKNOWLEDGMENT: 'bg-slate-100 text-slate-700',
    OTHER: 'bg-gray-100 text-gray-700',
};

export default function OnboardingStepItem({ step, checklistId, onUpdate }: OnboardingStepItemProps) {
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState(step.notes || '');
    const [updating, setUpdating] = useState(false);
    const isCompleted = step.status === 'COMPLETED';

    const toggleStep = async () => {
        setUpdating(true);
        try {
            const newStatus = isCompleted ? 'PENDING' : 'COMPLETED';
            const res = await fetch(`/api/crm/onboarding/${checklistId}/steps/${step.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, notes }),
            });
            if (!res.ok) throw new Error('Failed to update step');
            onUpdate();
        } catch {
            toast.error('Failed to update step');
        } finally {
            setUpdating(false);
        }
    };

    const saveNotes = async () => {
        try {
            const res = await fetch(`/api/crm/onboarding/${checklistId}/steps/${step.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: step.status, notes }),
            });
            if (!res.ok) throw new Error('Failed to save notes');
            toast.success('Notes saved');
            onUpdate();
        } catch {
            toast.error('Failed to save notes');
        }
    };

    return (
        <div className={`border rounded-lg p-3 ${isCompleted ? 'bg-green-50/50 border-green-200' : ''}`}>
            <div className="flex items-start gap-3">
                <Checkbox
                    checked={isCompleted}
                    onCheckedChange={toggleStep}
                    disabled={updating}
                    className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {step.label}
                        </span>
                        {step.required && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Required</Badge>
                        )}
                        <Badge className={`text-[10px] px-1.5 py-0 ${stepTypeColors[step.stepType] || stepTypeColors.OTHER}`}>
                            {step.stepType.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                    {step.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                    {isCompleted && step.completedBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Completed by {step.completedBy.firstName} {step.completedBy.lastName}
                        </p>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setShowNotes(!showNotes)}
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                </Button>
            </div>
            {showNotes && (
                <div className="mt-2 ml-8 flex gap-2">
                    <Input
                        placeholder="Add notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="text-sm h-8"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={saveNotes}>
                        Save
                    </Button>
                </div>
            )}
        </div>
    );
}
