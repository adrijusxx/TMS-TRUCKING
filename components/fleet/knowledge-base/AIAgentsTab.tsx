'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Settings, Trash2, Bot, MessageSquare, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import AgentConfigDialog from './AgentConfigDialog';

interface Agent {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isActive: boolean;
    _count: { documents: number };
    createdAt: string;
}

const SLUG_ICONS: Record<string, typeof Bot> = {
    'telegram-driver': MessageSquare,
    'web-chatbot': Globe,
};
const DEFAULT_SLUGS = ['telegram-driver', 'web-chatbot'];

export default function AIAgentsTab() {
    const queryClient = useQueryClient();
    const [editAgent, setEditAgent] = useState<Agent | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const { data: agents, isLoading } = useQuery<Agent[]>({
        queryKey: ['ai-agents'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/ai/agents'));
            if (!res.ok) throw new Error('Failed to fetch agents');
            return (await res.json()).data || [];
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(apiUrl(`/api/ai/agents/${id}`), { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Delete failed');
            }
        },
        onSuccess: () => {
            toast.success('Agent deleted');
            queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ['ai-agents'] });

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-sm">
                        Configure AI agents that respond in different contexts. Each agent has its own system prompt and can access specific knowledge base documents.
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Agent
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {agents?.map(agent => {
                    const Icon = SLUG_ICONS[agent.slug] || Bot;
                    const isDefault = DEFAULT_SLUGS.includes(agent.slug);
                    return (
                        <Card key={agent.id} className="relative group">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{agent.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                <code className="bg-muted px-1 rounded">{agent.slug}</code>
                                                {isDefault && <Badge variant="secondary" className="ml-2 text-[10px]">Default</Badge>}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                                        {agent.isActive ? 'Active' : 'Disabled'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {agent.description && (
                                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Model: <strong>{agent.model}</strong></span>
                                    <span>Temp: <strong>{agent.temperature}</strong></span>
                                    <span>Max: <strong>{agent.maxTokens}</strong> tokens</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px]">
                                        {agent._count.documents} KB docs assigned
                                    </Badge>
                                </div>
                                <div className="bg-muted/50 rounded-md p-3 max-h-24 overflow-hidden">
                                    <p className="text-xs text-muted-foreground font-mono line-clamp-3">
                                        {agent.systemPrompt}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <Button variant="outline" size="sm" onClick={() => setEditAgent(agent)}>
                                        <Settings className="h-3 w-3 mr-1" /> Configure
                                    </Button>
                                    {!isDefault && (
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                                            onClick={() => { if (confirm(`Delete "${agent.name}"? Documents will become shared.`)) deleteMutation.mutate(agent.id); }}>
                                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {(!agents || agents.length === 0) && (
                <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                    <Bot className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No agents configured. Default agents will be created automatically.</p>
                    <Button className="mt-4" onClick={handleRefresh}>Load Agents</Button>
                </div>
            )}

            {/* Edit dialog */}
            <AgentConfigDialog
                open={!!editAgent}
                onOpenChange={(o) => !o && setEditAgent(null)}
                agent={editAgent}
                onSaved={handleRefresh}
            />

            {/* Create dialog */}
            <AgentConfigDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                agent={null}
                onSaved={handleRefresh}
            />
        </div>
    );
}
