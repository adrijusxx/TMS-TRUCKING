'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus, MoreHorizontal, Play, Pause, Archive, Eye, MessageSquare, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import CampaignBuilder from './CampaignBuilder';
import CampaignDetail from './CampaignDetail';
import TemplateManager from './TemplateManager';
import AutomationRuleList from './AutomationRuleList';

interface Campaign {
    id: string;
    name: string;
    description: string | null;
    channel: 'SMS' | 'EMAIL';
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
    isDrip: boolean;
    totalRecipients: number;
    totalSent: number;
    totalFailed: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: { firstName: string; lastName: string };
    steps: { id: string }[];
    _count: { recipients: number };
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
};

export default function CampaignList() {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('campaigns');

    const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
        queryKey: ['campaigns'],
        queryFn: () => fetch('/api/crm/campaigns').then((r) => r.json()),
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/crm/campaigns/${id}/activate`, { method: 'POST' }).then((r) => {
                if (!r.ok) return r.json().then((e) => { throw new Error(e.error); });
                return r.json();
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Campaign activated');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const pauseMutation = useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/crm/campaigns/${id}/pause`, { method: 'POST' }).then((r) => {
                if (!r.ok) return r.json().then((e) => { throw new Error(e.error); });
                return r.json();
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Campaign paused');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const archiveMutation = useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/crm/campaigns/${id}`, { method: 'DELETE' }).then((r) => {
                if (!r.ok) throw new Error('Failed to archive');
                return r.json();
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Campaign archived');
        },
    });

    if (view === 'create') {
        return (
            <CampaignBuilder
                onBack={() => setView('list')}
                onCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
                    setView('list');
                }}
            />
        );
    }

    if (view === 'detail' && selectedId) {
        return (
            <CampaignDetail
                campaignId={selectedId}
                onBack={() => { setView('list'); setSelectedId(null); }}
            />
        );
    }

    const activeCampaigns = campaigns.filter((c) => !['ARCHIVED'].includes(c.status));

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="automations">Automations</TabsTrigger>
                </TabsList>
                {activeTab === 'campaigns' && (
                    <Button onClick={() => setView('create')} size="sm">
                        <Plus className="h-4 w-4 mr-1" /> New Campaign
                    </Button>
                )}
            </div>

            <TabsContent value="campaigns" className="mt-4">
                {isLoading ? (
                    <p className="text-muted-foreground text-sm">Loading campaigns...</p>
                ) : activeCampaigns.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <p className="mb-2">No campaigns yet</p>
                            <Button onClick={() => setView('create')} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" /> Create your first campaign
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Recipients</TableHead>
                                    <TableHead className="text-right">Sent</TableHead>
                                    <TableHead className="text-right">Failed</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeCampaigns.map((c) => (
                                    <TableRow
                                        key={c.id}
                                        className="cursor-pointer"
                                        onClick={() => { setSelectedId(c.id); setView('detail'); }}
                                    >
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{c.name}</p>
                                                {c.isDrip && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Drip ({c.steps.length} steps)
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {c.channel === 'SMS' ? (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <MessageSquare className="h-3.5 w-3.5" /> SMS
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-blue-600">
                                                    <Mail className="h-3.5 w-3.5" /> Email
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[c.status] || ''} variant="secondary">
                                                {c.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{c.totalRecipients}</TableCell>
                                        <TableCell className="text-right">{c.totalSent}</TableCell>
                                        <TableCell className="text-right">{c.totalFailed}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); setView('detail'); }}>
                                                        <Eye className="h-4 w-4 mr-2" /> View Details
                                                    </DropdownMenuItem>
                                                    {(c.status === 'DRAFT' || c.status === 'PAUSED') && (
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); activateMutation.mutate(c.id); }}>
                                                            <Play className="h-4 w-4 mr-2" /> Activate
                                                        </DropdownMenuItem>
                                                    )}
                                                    {c.status === 'ACTIVE' && (
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); pauseMutation.mutate(c.id); }}>
                                                            <Pause className="h-4 w-4 mr-2" /> Pause
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Archive this campaign?')) archiveMutation.mutate(c.id);
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Archive className="h-4 w-4 mr-2" /> Archive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
                <TemplateManager />
            </TabsContent>

            <TabsContent value="automations" className="mt-4">
                <AutomationRuleList />
            </TabsContent>
        </Tabs>
    );
}
