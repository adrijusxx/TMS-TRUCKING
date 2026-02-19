'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, MessageSquare, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplate {
    id: string;
    name: string;
    channel: 'SMS' | 'EMAIL';
    subject: string | null;
    body: string;
    createdAt: string;
    createdBy?: { firstName: string; lastName: string };
}

const PLACEHOLDERS = ['{{firstName}}', '{{lastName}}', '{{fullName}}', '{{leadNumber}}', '{{phone}}', '{{email}}'];

export default function TemplateManager() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', channel: 'SMS' as 'SMS' | 'EMAIL', subject: '', body: '' });

    const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
        queryKey: ['message-templates'],
        queryFn: () => fetch('/api/crm/templates').then((r) => r.json()),
    });

    const saveMutation = useMutation({
        mutationFn: async (data: typeof form & { id?: string }) => {
            const url = data.id ? `/api/crm/templates/${data.id}` : '/api/crm/templates';
            const method = data.id ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save template');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['message-templates'] });
            setDialogOpen(false);
            resetForm();
            toast.success(editingId ? 'Template updated' : 'Template created');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/crm/templates/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['message-templates'] });
            toast.success('Template deleted');
        },
    });

    function resetForm() {
        setForm({ name: '', channel: 'SMS', subject: '', body: '' });
        setEditingId(null);
    }

    function openNew() {
        resetForm();
        setDialogOpen(true);
    }

    function openEdit(t: MessageTemplate) {
        setForm({ name: t.name, channel: t.channel, subject: t.subject || '', body: t.body });
        setEditingId(t.id);
        setDialogOpen(true);
    }

    function insertPlaceholder(placeholder: string) {
        setForm((prev) => ({ ...prev, body: prev.body + placeholder }));
    }

    function handleSave() {
        saveMutation.mutate({ ...form, id: editingId || undefined });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Message Templates</h3>
                <Button onClick={openNew} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New Template
                </Button>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground text-sm">Loading templates...</p>
            ) : templates.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No templates yet. Create one to get started.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => (
                        <Card key={t.id} className="group">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {t.channel === 'SMS' ? (
                                            <MessageSquare className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Mail className="h-4 w-4 text-blue-600" />
                                        )}
                                        <CardTitle className="text-sm font-medium">{t.name}</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {t.channel}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {t.subject && (
                                    <p className="text-xs text-muted-foreground">
                                        Subject: {t.subject}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {t.body}
                                </p>
                                <div className="flex gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => {
                                            if (confirm('Delete this template?')) deleteMutation.mutate(t.id);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? 'Edit Template' : 'New Template'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Welcome SMS"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Channel</label>
                                <Select
                                    value={form.channel}
                                    onValueChange={(v) => setForm({ ...form, channel: v as 'SMS' | 'EMAIL' })}
                                    disabled={!!editingId}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SMS">SMS</SelectItem>
                                        <SelectItem value="EMAIL">Email</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {form.channel === 'EMAIL' && (
                            <div>
                                <label className="text-sm font-medium">Subject</label>
                                <Input
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    placeholder="Email subject line"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium">Message Body</label>
                            <Textarea
                                value={form.body}
                                onChange={(e) => setForm({ ...form, body: e.target.value })}
                                placeholder={form.channel === 'SMS' ? 'SMS message text...' : 'Email body (HTML supported)...'}
                                rows={6}
                            />
                            <div className="flex flex-wrap gap-1 mt-2">
                                {PLACEHOLDERS.map((p) => (
                                    <Button
                                        key={p} variant="outline" size="sm"
                                        className="text-xs h-6 px-2"
                                        onClick={() => insertPlaceholder(p)}
                                    >
                                        <Copy className="h-3 w-3 mr-1" /> {p}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {form.channel === 'SMS' && form.body && (
                            <p className="text-xs text-muted-foreground">
                                {form.body.length} characters
                                {form.body.length > 160 && ` (${Math.ceil(form.body.length / 160)} SMS segments)`}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
