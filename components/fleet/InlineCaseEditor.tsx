'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Loader2, DollarSign, FileText, Trash2, ExternalLink, Upload } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import CaseAssignmentPicker from './CaseAssignmentPicker';
import CasePaymentForm from './CasePaymentForm';
import QuickVendorCreate from './QuickVendorCreate';
import CaseLocationPanel from './CaseLocationPanel';
import CaseDropZone from './CaseDropZone';
import CasePhotoGrid from './CasePhotoGrid';

/* ─── Types ─── */
interface Assignment { id: string; userId: string; role?: string; user: { id: string; firstName: string; lastName: string; email: string; phone?: string; role: string }; }
interface Payment { id: string; paymentNumber: string; amount: number; paymentMethod: string; paymentDate: string; }
interface Doc { id: string; title: string; fileName: string; fileUrl: string; fileSize: number; type: string; createdAt: string; }
interface Breakdown {
    id: string; breakdownNumber: string; priority: string; status: string; breakdownType: string;
    location: string; latitude?: number | null; longitude?: number | null; description: string;
    serviceProvider?: string; serviceContact?: string; serviceAddress?: string;
    repairCost?: number; towingCost?: number; laborCost?: number; partsCost?: number; otherCosts?: number;
    totalCost: number; isDriverChargeable?: boolean; driverChargeNotes?: string;
    resolution?: string; repairNotes?: string; technicianNotes?: string;
    reportedAt?: string; dispatchedAt?: string; arrivedAt?: string; repairStartedAt?: string;
    repairCompletedAt?: string; truckReadyAt?: string; downtimeHours?: number;
    truck: { id: string; truckNumber: string; make?: string; model?: string; samsaraId?: string | null };
    driver?: { id: string; user: { firstName: string; lastName: string; phone?: string; email?: string } } | null;
    assignments?: Assignment[]; payments?: Payment[]; totalPaid?: number;
}

const STATUSES = [
    { v: 'REPORTED', l: 'Reported' }, { v: 'DISPATCHED', l: 'Dispatched' },
    { v: 'IN_PROGRESS', l: 'In Progress' }, { v: 'WAITING_PARTS', l: 'Waiting Parts' },
    { v: 'COMPLETED', l: 'Completed' }, { v: 'RESOLVED', l: 'Resolved' }, { v: 'CANCELLED', l: 'Cancelled' },
];
const PRIORITIES = [
    { v: 'CRITICAL', l: 'Critical' }, { v: 'HIGH', l: 'High' }, { v: 'MEDIUM', l: 'Medium' }, { v: 'LOW', l: 'Low' },
];
const DOC_TYPES = [{ v: 'WORK_ORDER', l: 'Work Order' }, { v: 'RECEIPT', l: 'Receipt' }, { v: 'INVOICE', l: 'Invoice' }];

export default function InlineCaseEditor({ breakdown, onClose }: { breakdown: Breakdown; onClose: () => void }) {
    const qc = useQueryClient();
    const [fd, setFd] = useState({
        status: breakdown.status, priority: breakdown.priority, location: breakdown.location,
        description: breakdown.description, serviceProvider: breakdown.serviceProvider || '',
        serviceContact: breakdown.serviceContact || '', serviceAddress: breakdown.serviceAddress || '',
        repairCost: breakdown.repairCost || 0, towingCost: breakdown.towingCost || 0,
        laborCost: breakdown.laborCost || 0, partsCost: breakdown.partsCost || 0, otherCosts: breakdown.otherCosts || 0,
        isDriverChargeable: breakdown.isDriverChargeable || false, driverChargeNotes: breakdown.driverChargeNotes || '',
        resolution: breakdown.resolution || '', repairNotes: breakdown.repairNotes || '', technicianNotes: breakdown.technicianNotes || '',
    });
    const s = (k: string, v: any) => setFd(p => ({ ...p, [k]: v }));

    const [pendingDoc, setPendingDoc] = useState<File | null>(null);
    const [docType, setDocType] = useState('RECEIPT');
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const { data: docsData } = useQuery({
        queryKey: ['breakdown-docs', breakdown.id],
        queryFn: async () => { const r = await fetch(apiUrl(`/api/breakdowns/${breakdown.id}/documents`)); if (!r.ok) throw new Error('Failed'); return r.json(); },
    });
    const docs: Doc[] = (docsData?.data?.documents || []).filter((d: Doc) => d.type !== 'OTHER');

    const saveMut = useMutation({
        mutationFn: async (data: any) => {
            const r = await fetch(apiUrl(`/api/breakdowns/${breakdown.id}`), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Failed'); }
            return r.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
            qc.invalidateQueries({ queryKey: ['activeBreakdowns-count'] });
            qc.invalidateQueries({ queryKey: ['fleet-metrics-summary'] });
            toast.success('Saved');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const docMut = useMutation({
        mutationFn: async ({ file, type }: { file: File; type: string }) => {
            if (type === 'WORK_ORDER') {
                const f = new FormData(); f.append('file', file); f.append('breakdownId', breakdown.id);
                const r = await fetch(apiUrl('/api/breakdowns/parse-work-order'), { method: 'POST', body: f });
                if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Parse failed'); }
                return { ...(await r.json()), isWorkOrder: true };
            }
            const f = new FormData();
            f.append('file', file); f.append('type', type); f.append('breakdownId', breakdown.id);
            f.append('title', file.name); f.append('fileName', file.name);
            f.append('fileSize', file.size.toString()); f.append('mimeType', file.type);
            const r = await fetch(apiUrl('/api/documents/upload'), { method: 'POST', body: f });
            if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Upload failed'); }
            return r.json();
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['breakdown-docs', breakdown.id] });
            if (data.isWorkOrder && data.data) {
                const d = data.data;
                ['repairCost', 'towingCost', 'laborCost', 'partsCost', 'otherCosts', 'serviceProvider', 'serviceContact', 'serviceAddress']
                    .forEach(k => { if (d[k]) s(k, d[k]); });
                toast.success('Work order parsed');
            } else { toast.success('Uploaded'); }
            setPendingDoc(null);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const delDocMut = useMutation({
        mutationFn: async (id: string) => { const r = await fetch(apiUrl(`/api/documents/${id}`), { method: 'DELETE' }); if (!r.ok) throw new Error('Failed'); },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['breakdown-docs', breakdown.id] }); toast.success('Deleted'); },
        onError: (e: Error) => toast.error(e.message),
    });

    const save = () => {
        const c = { repairCost: n(fd.repairCost), towingCost: n(fd.towingCost), laborCost: n(fd.laborCost), partsCost: n(fd.partsCost), otherCosts: n(fd.otherCosts) };
        const tl: Record<string, string> = {};
        const now = new Date().toISOString();
        if (fd.status !== breakdown.status) {
            if (fd.status === 'DISPATCHED' && !breakdown.dispatchedAt) tl.dispatchedAt = now;
            if (fd.status === 'IN_PROGRESS') { if (!breakdown.arrivedAt) tl.arrivedAt = now; if (!breakdown.repairStartedAt) tl.repairStartedAt = now; }
            if (fd.status === 'COMPLETED' && !breakdown.repairCompletedAt) tl.repairCompletedAt = now;
            if (fd.status === 'RESOLVED' && !breakdown.truckReadyAt) tl.truckReadyAt = now;
        }
        saveMut.mutate({ ...fd, ...c, ...tl });
    };

    const total = [fd.repairCost, fd.towingCost, fd.laborCost, fd.partsCost, fd.otherCosts].reduce((a, v) => a + n(v), 0);

    const addPhotos = (files: File[]) => {
        setPhotos(p => [...p, ...files].slice(0, 20));
        files.forEach(f => { const r = new FileReader(); r.onloadend = () => setPreviews(p => [...p, r.result as string]); r.readAsDataURL(f); });
    };

    return (
        <div className="flex gap-3 h-full min-h-0">
            <ScrollArea className="w-[280px] shrink-0 border-r pr-2">
                <CaseLocationPanel breakdown={breakdown} />
            </ScrollArea>

            <div className="flex-1 min-w-0">
                <ScrollArea className="h-full">
                    <div className="space-y-2 pr-2 pb-3">

                        {/* Save bar */}
                        <div className="flex items-center gap-2 sticky top-0 z-10 bg-background py-1">
                            <Button size="sm" className="flex-1 h-7 text-xs" onClick={save} disabled={saveMut.isPending}>
                                {saveMut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save All Changes
                            </Button>
                        </div>

                        {/* Details */}
                        <Section title="Details">
                            <div className="grid grid-cols-2 gap-1.5">
                                <F label="Status">
                                    <Select value={fd.status} onValueChange={v => s('status', v)}>
                                        <SelectTrigger className="h-6 text-[11px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{STATUSES.map(x => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </F>
                                <F label="Priority">
                                    <Select value={fd.priority} onValueChange={v => s('priority', v)}>
                                        <SelectTrigger className="h-6 text-[11px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{PRIORITIES.map(x => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </F>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                <F label="Provider"><Input value={fd.serviceProvider} onChange={e => s('serviceProvider', e.target.value)} placeholder="Shop" className="h-6 text-[11px]" /></F>
                                <F label="Contact"><Input value={fd.serviceContact} onChange={e => s('serviceContact', e.target.value)} placeholder="Phone" className="h-6 text-[11px]" /></F>
                                <F label="Address"><Input value={fd.serviceAddress} onChange={e => s('serviceAddress', e.target.value)} placeholder="Location" className="h-6 text-[11px]" /></F>
                            </div>
                            <F label="Description"><Textarea value={fd.description} onChange={e => s('description', e.target.value)} rows={2} className="text-[11px] resize-none leading-snug" /></F>
                            <F label="Resolution"><Textarea value={fd.resolution} onChange={e => s('resolution', e.target.value)} rows={2} placeholder="How resolved?" className="text-[11px] resize-none leading-snug" /></F>
                        </Section>

                        {/* Costs */}
                        <Section title="Costs">
                            <div className="grid grid-cols-3 gap-1.5">
                                {[['repairCost', 'Repair'], ['towingCost', 'Towing'], ['laborCost', 'Labor'], ['partsCost', 'Parts'], ['otherCosts', 'Other']].map(([k, l]) => (
                                    <F key={k} label={l}>
                                        <div className="relative">
                                            <DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                                            <Input type="number" step="0.01" value={(fd as any)[k]} onChange={e => s(k, parseFloat(e.target.value) || 0)} className="h-6 text-[11px] pl-4" />
                                        </div>
                                    </F>
                                ))}
                                <div>
                                    <Label className="text-[9px] text-muted-foreground">Total</Label>
                                    <div className="h-6 flex items-center px-1.5 bg-muted rounded text-xs font-bold tabular-nums">${total.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <Label className="text-[11px]">Driver chargeable?</Label>
                                <Switch checked={fd.isDriverChargeable} onCheckedChange={c => s('isDriverChargeable', c)} className="scale-75" />
                            </div>
                            {fd.isDriverChargeable && <F label="Reason"><Input value={fd.driverChargeNotes} onChange={e => s('driverChargeNotes', e.target.value)} className="h-6 text-[11px]" /></F>}
                        </Section>

                        {/* Documents + Photos */}
                        <Section title="Files & Photos">
                            <CaseDropZone onFileSelect={f => setPendingDoc(f)} label="Drop documents (work orders, receipts, invoices)" disabled={docMut.isPending} />
                            {pendingDoc && (
                                <div className="flex items-center gap-1.5 p-1.5 border rounded bg-muted/30">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-[11px] truncate flex-1">{pendingDoc.name}</span>
                                    <Select value={docType} onValueChange={setDocType}>
                                        <SelectTrigger className="h-5 text-[9px] w-[90px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.v} value={t.v} className="text-xs">{t.l}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Button size="sm" className="h-5 text-[9px] px-1.5" onClick={() => docMut.mutate({ file: pendingDoc, type: docType })} disabled={docMut.isPending}>
                                        {docMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Upload className="h-2.5 w-2.5 mr-0.5" />Upload</>}
                                    </Button>
                                </div>
                            )}
                            {docs.length > 0 && docs.map(d => (
                                <div key={d.id} className="flex items-center gap-1.5 py-0.5 text-[11px]">
                                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="truncate flex-1">{d.title || d.fileName}</span>
                                    <span className="text-[9px] text-muted-foreground">{d.type}</span>
                                    <button className="hover:text-primary" onClick={() => window.open(d.fileUrl, '_blank')}><ExternalLink className="h-3 w-3" /></button>
                                    <button className="hover:text-destructive" onClick={() => delDocMut.mutate(d.id)}><Trash2 className="h-3 w-3" /></button>
                                </div>
                            ))}
                            <Separator className="my-1" />
                            <CaseDropZone onFilesSelect={addPhotos} accept="image/png,image/jpeg" label="Drop proof & damage photos" sublabel="PNG, JPEG — max 10MB" icon="camera" multiple />
                            <CasePhotoGrid breakdownId={breakdown.id} pendingFiles={photos} pendingPreviews={previews}
                                onRemovePending={i => { setPhotos(p => p.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); }}
                                onClearPending={() => { setPhotos([]); setPreviews([]); }} />
                        </Section>

                        {/* Payments */}
                        <Section title="Payments">
                            <CasePaymentForm breakdownId={breakdown.id} payments={breakdown.payments || []} totalPaid={breakdown.totalPaid || 0} totalCost={total} />
                            <QuickVendorCreate compact onSuccess={v => { s('serviceProvider', v.name); s('serviceContact', v.phone); s('serviceAddress', v.city && v.state ? `${v.city}, ${v.state}` : v.state); toast.success('Vendor populated'); }} />
                        </Section>

                        {/* Notes + Team */}
                        <Section title="Notes & Team">
                            <F label="Technician Notes"><Textarea value={fd.technicianNotes} onChange={e => s('technicianNotes', e.target.value)} placeholder="From technician..." rows={2} className="text-[11px] resize-none leading-snug" /></F>
                            <F label="Repair Notes"><Textarea value={fd.repairNotes} onChange={e => s('repairNotes', e.target.value)} placeholder="Repair details..." rows={2} className="text-[11px] resize-none leading-snug" /></F>
                            <Separator className="my-1" />
                            <CaseAssignmentPicker breakdownId={breakdown.id} assignments={breakdown.assignments || []} />
                        </Section>

                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

/* ─── Helpers ─── */
const n = (v: any) => parseFloat(String(v)) || 0;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border rounded-md">
            <div className="px-2 py-1 bg-muted/40 border-b">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
            </div>
            <div className="px-2 py-1.5 space-y-1.5">{children}</div>
        </div>
    );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><Label className="text-[9px] text-muted-foreground leading-none">{label}</Label>{children}</div>;
}
