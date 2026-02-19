'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    ArrowLeft, Play, Pause, Users, Send, AlertCircle, Clock,
    MessageSquare, Mail, CheckCircle, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface Props {
    campaignId: string;
    onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
};

const RECIPIENT_STATUS_ICON: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    SENT: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
    FAILED: <XCircle className="h-3.5 w-3.5 text-destructive" />,
    OPTED_OUT: <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />,
};

export default function CampaignDetail({ campaignId, onBack }: Props) {
    const queryClient = useQueryClient();

    const { data: campaign, isLoading } = useQuery({
        queryKey: ['campaign', campaignId],
        queryFn: () => fetch(`/api/crm/campaigns/${campaignId}`).then((r) => r.json()),
    });

    const { data: recipientData } = useQuery({
        queryKey: ['campaign-recipients', campaignId],
        queryFn: () => fetch(`/api/crm/campaigns/${campaignId}/recipients`).then((r) => r.json()),
    });

    const activateMutation = useMutation({
        mutationFn: () =>
            fetch(`/api/crm/campaigns/${campaignId}/activate`, { method: 'POST' }).then((r) => {
                if (!r.ok) return r.json().then((e) => { throw new Error(e.error); });
                return r.json();
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Campaign activated');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const pauseMutation = useMutation({
        mutationFn: () =>
            fetch(`/api/crm/campaigns/${campaignId}/pause`, { method: 'POST' }).then((r) => {
                if (!r.ok) return r.json().then((e) => { throw new Error(e.error); });
                return r.json();
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Campaign paused');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    if (isLoading || !campaign) {
        return <p className="text-muted-foreground">Loading campaign...</p>;
    }

    const recipients = recipientData?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">{campaign.name}</h2>
                            <Badge className={STATUS_COLORS[campaign.status] || ''} variant="secondary">
                                {campaign.status}
                            </Badge>
                        </div>
                        {campaign.description && (
                            <p className="text-sm text-muted-foreground">{campaign.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {(campaign.status === 'DRAFT' || campaign.status === 'PAUSED') && (
                        <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            {campaign.status === 'PAUSED' ? 'Resume' : 'Activate'}
                        </Button>
                    )}
                    {campaign.status === 'ACTIVE' && (
                        <Button variant="outline" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending} size="sm">
                            <Pause className="h-4 w-4 mr-1" /> Pause
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Recipients</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{campaign.totalRecipients}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-muted-foreground">Sent</span>
                        </div>
                        <p className="text-2xl font-bold mt-1 text-green-600">{campaign.totalSent}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-sm text-muted-foreground">Failed</span>
                        </div>
                        <p className="text-2xl font-bold mt-1 text-destructive">{campaign.totalFailed}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            {campaign.channel === 'SMS' ? (
                                <MessageSquare className="h-4 w-4 text-green-600" />
                            ) : (
                                <Mail className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="text-sm text-muted-foreground">Channel</span>
                        </div>
                        <p className="text-lg font-medium mt-1">
                            {campaign.channel} {campaign.isDrip && `(${campaign.steps.length} steps)`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Steps timeline */}
            {campaign.steps.length > 1 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Drip Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {campaign.steps.map((step: any, i: number) => (
                                <div key={step.id} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 text-sm">
                                        {step.template?.name || 'Custom message'}
                                        {i > 0 && (
                                            <span className="text-muted-foreground ml-2">
                                                (after {step.delayDays}d {step.delayHours}h)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recipients */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recipients ({recipientData?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    {recipients.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            {campaign.status === 'DRAFT'
                                ? 'Recipients will be enrolled when the campaign is activated.'
                                : 'No recipients yet.'}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lead</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Step</TableHead>
                                    <TableHead>Enrolled</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipients.map((r: any) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">
                                            {r.lead.firstName} {r.lead.lastName}
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({r.lead.leadNumber})
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {campaign.channel === 'SMS' ? r.lead.phone : r.lead.email}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {RECIPIENT_STATUS_ICON[r.status]}
                                                <span className="text-sm">{r.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {r.currentStepIndex + 1} / {campaign.steps.length}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(r.enrolledAt), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
