'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Save, Loader2, Star, FileText, Pencil } from 'lucide-react';

interface TemplateStep {
    id?: string;
    stepType: string;
    label: string;
    description?: string;
    required: boolean;
    sortOrder: number;
}

interface Template {
    id: string;
    name: string;
    description?: string;
    isDefault: boolean;
    steps: TemplateStep[];
}

const STEP_TYPES = [
    { value: 'DOCUMENT_UPLOAD', label: 'Document Upload' },
    { value: 'FORM_COMPLETION', label: 'Form Completion' },
    { value: 'BACKGROUND_CHECK', label: 'Background Check' },
    { value: 'DRUG_TEST', label: 'Drug Test' },
    { value: 'MEDICAL_CARD', label: 'Medical Card' },
    { value: 'MVR_CHECK', label: 'MVR Check' },
    { value: 'EQUIPMENT_ASSIGNMENT', label: 'Equipment Assignment' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'ORIENTATION', label: 'Orientation' },
    { value: 'POLICY_ACKNOWLEDGMENT', label: 'Policy Acknowledgment' },
];

function StepTypeLabel({ stepType }: { stepType: string }) {
    return <>{STEP_TYPES.find((t) => t.value === stepType)?.label || stepType}</>;
}

export default function OnboardingTemplateEditor() {
    const queryClient = useQueryClient();
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['onboarding-templates'],
        queryFn: async () => {
            const res = await fetch('/api/crm/onboarding-templates');
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/crm/onboarding-templates/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Template deleted');
            queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] });
        },
        onError: () => toast.error('Failed to delete template'),
    });

    const templates: Template[] = data?.templates || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Onboarding Templates</h2>
                    <p className="text-sm text-muted-foreground">
                        Customize the steps new hires go through during onboarding.
                    </p>
                </div>
                <Button onClick={() => { setIsCreating(true); setEditingTemplate(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                </Button>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="py-8 flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </CardContent>
                </Card>
            ) : templates.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No custom templates yet. The system default will be used.</p>
                    </CardContent>
                </Card>
            ) : (
                templates.map((template) => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        onEdit={() => setEditingTemplate(template)}
                        onDelete={() => deleteMutation.mutate(template.id)}
                    />
                ))
            )}

            {(isCreating || editingTemplate) && (
                <TemplateFormDialog
                    template={editingTemplate}
                    onClose={() => { setEditingTemplate(null); setIsCreating(false); }}
                />
            )}
        </div>
    );
}

function TemplateCard({ template, onEdit, onDelete }: {
    template: Template;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        {template.name}
                        {template.isDefault && (
                            <Badge variant="secondary" className="gap-1">
                                <Star className="h-3 w-3" /> Default
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={onEdit}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onDelete}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
                {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                    {template.steps.map((step, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                            {step.label}
                            {!step.required && <span className="ml-1 opacity-50">(opt)</span>}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function TemplateFormDialog({ template, onClose }: {
    template: Template | null;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const isEditing = !!template;

    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [isDefault, setIsDefault] = useState(template?.isDefault || false);
    const [steps, setSteps] = useState<TemplateStep[]>(
        template?.steps || [{ stepType: 'DOCUMENT_UPLOAD', label: '', required: true, sortOrder: 0 }]
    );

    const saveMutation = useMutation({
        mutationFn: async () => {
            const url = isEditing
                ? `/api/crm/onboarding-templates/${template!.id}`
                : '/api/crm/onboarding-templates';
            const method = isEditing ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isDefault, steps }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success(isEditing ? 'Template updated' : 'Template created');
            queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] });
            onClose();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const addStep = () => {
        setSteps([...steps, { stepType: 'DOCUMENT_UPLOAD', label: '', required: true, sortOrder: steps.length }]);
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const updateStep = (index: number, field: string, value: any) => {
        setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    };

    const moveStep = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= steps.length) return;
        const updated = [...steps];
        [updated[index], updated[target]] = [updated[target], updated[index]];
        setSteps(updated);
    };

    const canSave = name.trim() && steps.length > 0 && steps.every((s) => s.label.trim());

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Template' : 'New Onboarding Template'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Template Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Company Driver Onboarding" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                        <Label>Set as default template for new hires</Label>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Steps ({steps.length})</Label>
                            <Button variant="outline" size="sm" onClick={addStep}>
                                <Plus className="h-3 w-3 mr-1" /> Add Step
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                                    <div className="flex flex-col gap-0.5">
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveStep(index, -1)} disabled={index === 0}>
                                            <GripVertical className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <span className="text-xs text-muted-foreground w-5">{index + 1}</span>

                                    <Select value={step.stepType} onValueChange={(v) => updateStep(index, 'stepType', v)}>
                                        <SelectTrigger className="w-44 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STEP_TYPES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        className="h-8 text-sm flex-1"
                                        value={step.label}
                                        onChange={(e) => updateStep(index, 'label', e.target.value)}
                                        placeholder="Step label"
                                    />

                                    <div className="flex items-center gap-1">
                                        <Switch
                                            checked={step.required}
                                            onCheckedChange={(v) => updateStep(index, 'required', v)}
                                        />
                                        <span className="text-xs whitespace-nowrap">Req</span>
                                    </div>

                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStep(index)} disabled={steps.length <= 1}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending}>
                        {saveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {isEditing ? 'Update' : 'Create'} Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
