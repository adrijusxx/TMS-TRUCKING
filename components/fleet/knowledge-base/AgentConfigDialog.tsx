'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface AgentData {
    id?: string;
    slug: string;
    name: string;
    description?: string | null;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isActive: boolean;
}

interface AgentConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agent: AgentData | null;
    onSaved: () => void;
}

const DEFAULT_AGENTS = ['telegram-driver', 'web-chatbot'];
const MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast, cheap)' },
    { value: 'gpt-4o', label: 'GPT-4o (Balanced)' },
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo (Most capable)' },
];

export default function AgentConfigDialog({ open, onOpenChange, agent, onSaved }: AgentConfigDialogProps) {
    const isEdit = !!agent?.id;
    const isDefault = agent ? DEFAULT_AGENTS.includes(agent.slug) : false;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<AgentData>({
        slug: '', name: '', description: '', systemPrompt: '', model: 'gpt-4o-mini', temperature: 0.3, maxTokens: 500, isActive: true,
    });

    useEffect(() => {
        if (agent) {
            setForm({ ...agent });
        } else {
            setForm({ slug: '', name: '', description: '', systemPrompt: '', model: 'gpt-4o-mini', temperature: 0.3, maxTokens: 500, isActive: true });
        }
    }, [agent, open]);

    const handleSave = async () => {
        if (!form.name || !form.systemPrompt) {
            toast.error('Name and system prompt are required');
            return;
        }
        if (!isEdit && !form.slug) {
            toast.error('Slug is required');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit ? apiUrl(`/api/ai/agents/${agent!.id}`) : apiUrl('/api/ai/agents');
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }
            toast.success(isEdit ? 'Agent updated' : 'Agent created');
            onSaved();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEdit ? 'Edit Agent' : 'Create Agent'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? 'Customize this agent\'s behavior and system prompt.' : 'Create a new AI agent with its own personality and knowledge scope.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Custom Agent" />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                placeholder="my-agent" disabled={isDefault} />
                            {isDefault && <p className="text-xs text-muted-foreground">Default agent slug cannot be changed</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={form.description || ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this agent do?" />
                    </div>

                    <div className="space-y-2">
                        <Label>System Prompt</Label>
                        <Textarea value={form.systemPrompt} onChange={(e) => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
                            placeholder="You are a TMS AI assistant..." rows={10} className="font-mono text-sm" />
                        <p className="text-xs text-muted-foreground">{form.systemPrompt.length}/10,000 characters</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>AI Model</Label>
                            <Select value={form.model} onValueChange={(v) => setForm(f => ({ ...f, model: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Max Tokens</Label>
                            <Input type="number" value={form.maxTokens} onChange={(e) => setForm(f => ({ ...f, maxTokens: parseInt(e.target.value) || 500 }))} min={100} max={4000} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Temperature</Label>
                            <span className="text-sm text-muted-foreground">{form.temperature.toFixed(1)}</span>
                        </div>
                        <Slider value={[form.temperature]} onValueChange={([v]) => setForm(f => ({ ...f, temperature: v }))} min={0} max={1} step={0.1} />
                        <p className="text-xs text-muted-foreground">Lower = more factual, Higher = more creative</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Active</Label>
                            <p className="text-xs text-muted-foreground">Disable to temporarily stop this agent from responding</p>
                        </div>
                        <Switch checked={form.isActive} onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))} />
                    </div>
                </div>

                <SheetFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEdit ? 'Save Changes' : 'Create Agent'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
