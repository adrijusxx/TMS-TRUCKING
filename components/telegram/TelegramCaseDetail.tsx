'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ArrowLeft, MapPin, Truck, Clock, Save, Loader2,
    AlertTriangle, ShieldAlert, Wrench, Phone, DollarSign, Users, Navigation,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface CaseData {
    id: string;
    caseType: 'breakdown' | 'safety' | 'maintenance';
    caseNumber: string;
    status: string;
    priority: string;
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    reportedAt: string;
    driverName: string;
    driverPhone?: string;
    truckNumber: string;
    truckId?: string;
    samsaraId?: string;
}

interface TelegramCaseDetailProps {
    caseData: CaseData;
    onBack: () => void;
}

const STATUSES = [
    { value: 'REPORTED', label: 'Reported' },
    { value: 'DISPATCHED', label: 'Dispatched' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING_PARTS', label: 'Waiting Parts' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'RESOLVED', label: 'Resolved' },
];

const PRIORITIES = [
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
];

const TYPE_CONFIG = {
    breakdown: { icon: AlertTriangle, label: 'Breakdown', color: 'text-red-500' },
    safety: { icon: ShieldAlert, label: 'Safety Incident', color: 'text-orange-500' },
    maintenance: { icon: Wrench, label: 'Maintenance', color: 'text-blue-500' },
};

export default function TelegramCaseDetail({ caseData, onBack }: TelegramCaseDetailProps) {
    const queryClient = useQueryClient();
    const typeConf = TYPE_CONFIG[caseData.caseType];
    const TypeIcon = typeConf.icon;

    // Fetch full case details
    const apiPath = caseData.caseType === 'breakdown'
        ? `/api/breakdowns/${caseData.id}`
        : caseData.caseType === 'safety'
            ? `/api/safety/incidents/${caseData.id}`
            : `/api/maintenance/${caseData.id}`;

    const { data: fullCase, isLoading: caseLoading } = useQuery({
        queryKey: ['case-detail', caseData.id],
        queryFn: async () => {
            const res = await fetch(apiUrl(apiPath));
            if (!res.ok) return null;
            const json = await res.json();
            return json.data || json;
        },
    });

    // Fetch live Samsara location
    const { data: samsaraLocation } = useQuery({
        queryKey: ['samsara-location', caseData.samsaraId],
        queryFn: async () => {
            if (!caseData.samsaraId) return null;
            const res = await fetch(apiUrl(`/api/fleet/device-queue?action=vehicle-location&samsaraId=${caseData.samsaraId}`));
            if (!res.ok) return null;
            const json = await res.json();
            return json.data?.location || null;
        },
        enabled: !!caseData.samsaraId,
        refetchInterval: 60000,
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <TypeIcon className={`h-5 w-5 ${typeConf.color}`} />
                    <h2 className="text-lg font-bold">{caseData.caseNumber}</h2>
                    <Badge variant="outline">{typeConf.label}</Badge>
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left Panel — Location & Overview */}
                <div className="lg:col-span-3 space-y-4">
                    <CaseLocationPanel
                        caseData={caseData}
                        samsaraLocation={samsaraLocation}
                    />
                    <CaseTimelinePanel caseData={caseData} fullCase={fullCase} />
                </div>

                {/* Right Panel — Editor */}
                <div className="lg:col-span-2">
                    <CaseEditorPanel
                        caseData={caseData}
                        fullCase={fullCase}
                        isLoading={caseLoading}
                    />
                </div>
            </div>
        </div>
    );
}

/** Left panel: driver/truck location + map */
function CaseLocationPanel({ caseData, samsaraLocation }: { caseData: CaseData; samsaraLocation: any }) {
    const address = samsaraLocation?.formattedAddress || samsaraLocation?.address || caseData.location || 'Unknown';
    const lat = samsaraLocation?.latitude || caseData.latitude;
    const lng = samsaraLocation?.longitude || caseData.longitude;
    const hasCoords = lat && lng;
    const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : null;

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                {/* Driver & Truck Info */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                        <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-[10px] text-muted-foreground">Truck</p>
                            <p className="text-sm font-medium">{caseData.truckNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-[10px] text-muted-foreground">Driver</p>
                            <p className="text-sm font-medium">{caseData.driverName}</p>
                            {caseData.driverPhone && (
                                <a href={`tel:${caseData.driverPhone}`} className="text-[10px] text-primary flex items-center gap-0.5">
                                    <Phone className="h-2.5 w-2.5" />{caseData.driverPhone}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-medium">
                                    {samsaraLocation ? 'Live Location (Samsara)' : 'Reported Location'}
                                </p>
                                <p className="text-sm mt-0.5">{address}</p>
                                {hasCoords && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                        {lat.toFixed(5)}, {lng.toFixed(5)}
                                    </p>
                                )}
                            </div>
                        </div>
                        {mapsUrl && (
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                    <Navigation className="h-3 w-3" />
                                    Map
                                </Button>
                            </a>
                        )}
                    </div>
                    {samsaraLocation && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-green-600">
                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live GPS · Updated {samsaraLocation.time ? formatDistanceToNow(new Date(samsaraLocation.time), { addSuffix: true }) : 'just now'}
                        </div>
                    )}
                </div>

                {/* Static Map Image */}
                {hasCoords && (
                    <div className="rounded-lg overflow-hidden border h-[200px]">
                        <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=600x200&scale=2&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt="Location map"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/** Timeline section */
function CaseTimelinePanel({ caseData, fullCase }: { caseData: CaseData; fullCase: any }) {
    if (caseData.caseType !== 'breakdown' || !fullCase) return null;

    const events = [
        { label: 'Reported', time: fullCase.reportedAt },
        { label: 'Dispatched', time: fullCase.dispatchedAt },
        { label: 'Arrived', time: fullCase.arrivedAt },
        { label: 'Repair Started', time: fullCase.repairStartedAt },
        { label: 'Repair Completed', time: fullCase.repairCompletedAt },
        { label: 'Truck Ready', time: fullCase.truckReadyAt },
    ];

    return (
        <Card>
            <CardContent className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                    <Clock className="h-4 w-4" /> Timeline
                </h3>
                <div className="space-y-1">
                    {events.map((e, i) => {
                        const completed = !!e.time;
                        return (
                            <div key={i} className="flex items-center gap-3 py-1.5">
                                <div className={`h-2 w-2 rounded-full shrink-0 ${completed ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                                <span className={`text-xs flex-1 ${completed ? 'font-medium' : 'text-muted-foreground'}`}>
                                    {e.label}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {e.time ? new Date(e.time).toLocaleString() : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {fullCase.downtimeHours > 0 && (
                    <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <span className="text-xs text-orange-600">Total Downtime: </span>
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{fullCase.downtimeHours.toFixed(1)}h</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/** Right panel: editable fields */
function CaseEditorPanel({ caseData, fullCase, isLoading }: { caseData: CaseData; fullCase: any; isLoading: boolean }) {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('details');

    const [formData, setFormData] = useState({
        status: caseData.status,
        priority: caseData.priority,
        location: caseData.location || '',
        description: caseData.description || '',
        serviceProvider: '',
        serviceContact: '',
        resolution: '',
        repairCost: 0,
        towingCost: 0,
        laborCost: 0,
        partsCost: 0,
        otherCosts: 0,
    });

    // Populate from full case when loaded
    const [populated, setPopulated] = useState(false);
    if (fullCase && !populated) {
        setFormData(prev => ({
            ...prev,
            status: fullCase.status || prev.status,
            priority: fullCase.priority || prev.priority,
            location: fullCase.location || prev.location,
            description: fullCase.description || prev.description,
            serviceProvider: fullCase.serviceProvider || '',
            serviceContact: fullCase.serviceContact || '',
            resolution: fullCase.resolution || '',
            repairCost: fullCase.repairCost || 0,
            towingCost: fullCase.towingCost || 0,
            laborCost: fullCase.laborCost || 0,
            partsCost: fullCase.partsCost || 0,
            otherCosts: fullCase.otherCosts || 0,
        }));
        setPopulated(true);
    }

    const apiPath = caseData.caseType === 'breakdown'
        ? `/api/breakdowns/${caseData.id}`
        : caseData.caseType === 'safety'
            ? `/api/safety/incidents/${caseData.id}`
            : `/api/maintenance/${caseData.id}`;

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(apiUrl(apiPath), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['case-detail', caseData.id] });
            queryClient.invalidateQueries({ queryKey: ['telegram-active-cases'] });
            toast.success('Case updated');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const totalCost = (formData.repairCost || 0) + (formData.towingCost || 0) + (formData.laborCost || 0) + (formData.partsCost || 0) + (formData.otherCosts || 0);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-4">
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="grid w-full grid-cols-3 h-8">
                        <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                        <TabsTrigger value="costs" className="text-xs">
                            Costs {totalCost > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">${totalCost}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                    </TabsList>

                    {/* Details */}
                    <TabsContent value="details" className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px]">Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px]">Priority</Label>
                                <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />Location</Label>
                            <Input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="h-8 text-xs" />
                        </div>

                        {caseData.caseType === 'breakdown' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Service Provider</Label>
                                    <Input value={formData.serviceProvider} onChange={e => setFormData(p => ({ ...p, serviceProvider: e.target.value }))} className="h-8 text-xs" placeholder="Repair shop" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Contact</Label>
                                    <Input value={formData.serviceContact} onChange={e => setFormData(p => ({ ...p, serviceContact: e.target.value }))} className="h-8 text-xs" placeholder="Phone" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label className="text-[10px]">Description</Label>
                            <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="text-xs resize-none" />
                        </div>

                        <Button size="sm" className="w-full" onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                            Save
                        </Button>
                    </TabsContent>

                    {/* Costs */}
                    <TabsContent value="costs" className="mt-3 space-y-3">
                        {['repairCost', 'towingCost', 'laborCost', 'partsCost', 'otherCosts'].map(field => (
                            <div key={field} className="space-y-1">
                                <Label className="text-[10px] capitalize">{field.replace('Cost', ' Cost').replace('Costs', ' Costs')}</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={(formData as any)[field]}
                                        onChange={e => setFormData(p => ({ ...p, [field]: parseFloat(e.target.value) || 0 }))}
                                        className="h-8 text-xs pl-6"
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="p-2 bg-muted rounded flex items-center justify-between">
                            <span className="text-xs font-semibold">Total</span>
                            <span className="text-sm font-bold">${totalCost.toFixed(2)}</span>
                        </div>
                        <Button size="sm" className="w-full" onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                            Save Costs
                        </Button>
                    </TabsContent>

                    {/* Notes */}
                    <TabsContent value="notes" className="mt-3 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[10px]">Resolution / Repair Notes</Label>
                            <Textarea
                                value={formData.resolution}
                                onChange={e => setFormData(p => ({ ...p, resolution: e.target.value }))}
                                rows={6}
                                placeholder="How was the issue resolved?"
                                className="text-xs resize-none"
                            />
                        </div>
                        <Button size="sm" className="w-full" onClick={() => updateMutation.mutate({ resolution: formData.resolution })} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                            Save Notes
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
