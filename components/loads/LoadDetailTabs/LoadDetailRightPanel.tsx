'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadType, EquipmentType } from '@prisma/client';
import { usePermissions } from '@/hooks/usePermissions';
import { History, CheckCircle2, XCircle, AlertTriangle, Plus, FileText } from 'lucide-react';
import { formatDateTime, formatCurrency, apiUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { LoadChangeLog } from '../LoadChangeLog';
import LoadActivityTab from './LoadActivityTab';
import LoadHistoryDocumentsTab from './LoadHistoryDocumentsTab';
import LoadFinancialTab from './LoadFinancialTab';
import AccessorialChargeForm from '@/components/accessorial/AccessorialChargeForm';
import RateConfirmationForm from '@/components/rate-confirmations/RateConfirmationForm';

interface LoadDetailRightPanelProps {
  load: any;
  loadId: string;
  formData: any;
  onFormDataChange: (data: any) => void;
  onLoadRefetch: () => void;
  customers: any[];
}

type TimelineTab = 'activity' | 'timestamps' | 'changelog';
type DetailTab = 'details' | 'specs' | 'charges' | 'financial' | 'notes';

async function fetchLoadExpenses(loadId: string) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}/expenses`));
  if (!response.ok) throw new Error('Failed to fetch expenses');
  return response.json();
}

async function fetchAccessorialCharges(loadId: string) {
  const response = await fetch(apiUrl(`/api/accessorial-charges?loadId=${loadId}`));
  if (!response.ok) throw new Error('Failed to fetch accessorial charges');
  return response.json();
}

export default function LoadDetailRightPanel({
  load, loadId, formData, onFormDataChange, onLoadRefetch, customers,
}: LoadDetailRightPanelProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');
  const [timelineTab, setTimelineTab] = useState<TimelineTab>('activity');
  const [detailTab, setDetailTab] = useState<DetailTab>('details');
  const [showAccessorialForm, setShowAccessorialForm] = useState(false);
  const [showRateConForm, setShowRateConForm] = useState(false);

  const isReefer = (formData.equipmentType || load.equipmentType) === 'REEFER';

  const { data: expensesData } = useQuery({
    queryKey: ['load-expenses', load.id],
    queryFn: () => fetchLoadExpenses(load.id),
    enabled: !!load.id,
  });
  const { data: chargesData } = useQuery({
    queryKey: ['load-accessorial-charges', load.id],
    queryFn: () => fetchAccessorialCharges(load.id),
    enabled: !!load.id,
  });
  const expenses = expensesData?.data?.expenses || [];
  const accessorialCharges = chargesData?.data?.data || [];

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-3">
      {/* Documents */}
      <LoadHistoryDocumentsTab load={load} />

      {/* Tabbed Details Card */}
      <Card>
        <CardHeader className="py-2 px-3">
          <div className="flex items-center gap-1 flex-wrap">
            {(['details', 'specs', 'charges', 'financial', 'notes'] as DetailTab[]).map((tab) => (
              <Button
                key={tab}
                variant={detailTab === tab ? 'default' : 'ghost'}
                size="sm"
                className="h-6 text-[10px] px-2 capitalize"
                onClick={() => setDetailTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3">
          {detailTab === 'details' && (
            <DetailsContent load={load} formData={formData} canEdit={canEdit} updateField={updateField} />
          )}
          {detailTab === 'specs' && (
            <SpecsContent load={load} formData={formData} canEdit={canEdit} updateField={updateField} isReefer={isReefer} />
          )}
          {detailTab === 'charges' && (
            <ChargesContent
              load={load} canEdit={canEdit} expenses={expenses} accessorialCharges={accessorialCharges}
              onShowAccessorialForm={() => setShowAccessorialForm(true)}
              onShowRateConForm={() => setShowRateConForm(true)}
            />
          )}
          {detailTab === 'financial' && (
            <LoadFinancialTab load={load} formData={formData} onFormDataChange={onFormDataChange} onLoadRefetch={onLoadRefetch} />
          )}
          {detailTab === 'notes' && (
            <NotesContent load={load} formData={formData} canEdit={canEdit} updateField={updateField} />
          )}
        </CardContent>
      </Card>

      {/* Timeline & History */}
      <Card>
        <CardHeader className="py-2.5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Timeline & History</CardTitle>
            </div>
            <div className="flex gap-0.5">
              {(['activity', 'timestamps', 'changelog'] as TimelineTab[]).map((tab) => (
                <Button
                  key={tab}
                  variant={timelineTab === tab ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[10px] px-2 capitalize"
                  onClick={() => setTimelineTab(tab)}
                >
                  {tab === 'changelog' ? 'Changes' : tab}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3">
          {timelineTab === 'activity' && <LoadActivityTab load={load} />}
          {timelineTab === 'timestamps' && <StatusTimestamps load={load} />}
          {timelineTab === 'changelog' && <LoadChangeLog loadId={loadId} />}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {canEdit && (
        <>
          <AccessorialChargeForm
            open={showAccessorialForm}
            onOpenChange={setShowAccessorialForm}
            loadId={load.id}
            onSuccess={() => { setShowAccessorialForm(false); window.location.reload(); }}
          />
          <RateConfirmationForm
            open={showRateConForm}
            onOpenChange={setShowRateConForm}
            loadId={load.id}
            confirmationId={load.rateConfirmation?.id}
            onSuccess={() => { setShowRateConForm(false); window.location.reload(); }}
          />
        </>
      )}
    </div>
  );
}

/* ─── Status Timestamps ─── */
function StatusTimestamps({ load }: { load: any }) {
  const timestamps = [
    { label: 'Assigned', value: load.assignedAt },
    { label: 'Picked Up', value: load.pickedUpAt },
    { label: 'Delivered', value: load.deliveredAt },
    { label: 'Invoiced', value: load.invoicedAt },
    { label: 'Paid', value: load.paidAt },
  ].filter((t) => t.value);

  return (
    <div className="space-y-3">
      {timestamps.length > 0 ? (
        <div className="grid gap-2 grid-cols-2">
          {timestamps.map((t) => (
            <div key={t.label} className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <Label className="text-[10px] text-muted-foreground">{t.label}</Label>
                <p className="font-medium text-xs">{formatDateTime(t.value)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">No timestamps recorded</p>
      )}
      {(load.ediSent || load.ediReceived || load.ediTransactionId) && (
        <div className="pt-2 border-t space-y-1.5">
          <Label className="text-xs font-medium">EDI Tracking</Label>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              {load.ediSent ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <XCircle className="h-3 w-3 text-gray-400" />}
              <span>Sent</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {load.ediReceived ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <XCircle className="h-3 w-3 text-gray-400" />}
              <span>Received</span>
            </div>
          </div>
          {load.ediTransactionId && <p className="text-[10px] text-muted-foreground">ID: {load.ediTransactionId}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Load Details Tab Content ─── */
function DetailsContent({ load, formData, canEdit, updateField }: {
  load: any; formData: any; canEdit: boolean; updateField: (f: string, v: any) => void;
}) {
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1">
        <Label className="text-xs">Load Type</Label>
        {canEdit ? (
          <Select value={formData.loadType || load.loadType} onValueChange={(v) => updateField('loadType', v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(LoadType).map((type) => (
                <SelectItem key={type} value={type} className="text-xs">{type.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : <p className="text-xs font-medium">{load.loadType}</p>}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Equipment</Label>
        {canEdit ? (
          <Select value={formData.equipmentType || load.equipmentType} onValueChange={(v) => updateField('equipmentType', v)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(EquipmentType).map((type) => (
                <SelectItem key={type} value={type} className="text-xs">{type.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : <p className="text-xs font-medium">{load.equipmentType?.replace(/_/g, ' ')}</p>}
      </div>
    </div>
  );
}

/* ─── Specs Tab Content ─── */
function SpecsContent({ load, formData, canEdit, updateField, isReefer }: {
  load: any; formData: any; canEdit: boolean; updateField: (f: string, v: any) => void; isReefer: boolean;
}) {
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs">Weight (lbs)</Label>
        {canEdit ? <Input type="number" value={formData.weight || load.weight || ''} onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)} className="h-7 text-xs" /> : <p className="text-xs font-medium">{load.weight?.toLocaleString() || '—'}</p>}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Pieces</Label>
        {canEdit ? <Input type="number" value={formData.pieces || load.pieces || ''} onChange={(e) => updateField('pieces', e.target.value ? parseInt(e.target.value) : null)} className="h-7 text-xs" /> : <p className="text-xs font-medium">{load.pieces || '—'}</p>}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Pallets</Label>
        {canEdit ? <Input type="number" value={formData.pallets || load.pallets || ''} onChange={(e) => updateField('pallets', e.target.value ? parseInt(e.target.value) : null)} className="h-7 text-xs" /> : <p className="text-xs font-medium">{load.pallets || '—'}</p>}
      </div>
      {(isReefer || load.temperature) && (
        <div className="space-y-1">
          <Label className="text-xs">Temp (°F)</Label>
          {canEdit ? <Input type="number" value={formData.temperature || load.temperature || ''} onChange={(e) => updateField('temperature', e.target.value || null)} className="h-7 text-xs" /> : <p className="text-xs font-medium">{load.temperature ? `${load.temperature}°F` : '—'}</p>}
        </div>
      )}
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Commodity</Label>
        {canEdit ? <Input value={formData.commodity || load.commodity || ''} onChange={(e) => updateField('commodity', e.target.value || null)} className="h-7 text-xs" /> : <p className="text-xs font-medium">{load.commodity || '—'}</p>}
      </div>
      <div className="space-y-1 col-span-2 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
        <Label className="text-xs">Hazmat</Label>
        {canEdit ? <input type="checkbox" checked={formData.hazmat ?? load.hazmat ?? false} onChange={(e) => updateField('hazmat', e.target.checked)} className="h-3.5 w-3.5" /> : <span className="text-xs">{load.hazmat ? 'Yes' : 'No'}</span>}
      </div>
    </div>
  );
}

/* ─── Charges Tab Content ─── */
function ChargesContent({ load, canEdit, expenses, accessorialCharges, onShowAccessorialForm, onShowRateConForm }: {
  load: any; canEdit: boolean; expenses: any[]; accessorialCharges: any[];
  onShowAccessorialForm: () => void; onShowRateConForm: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Expenses ({expenses.length})</Label>
      </div>
      {expenses.length > 0 ? (
        <div className="space-y-1">
          {expenses.slice(0, 3).map((expense: any) => (
            <div key={expense.id} className="flex justify-between text-xs p-1.5 bg-muted/30 rounded">
              <span>{expense.expenseType}</span>
              <span className="font-medium">{formatCurrency(expense.amount)}</span>
            </div>
          ))}
          {expenses.length > 3 && <p className="text-[10px] text-muted-foreground">+{expenses.length - 3} more</p>}
        </div>
      ) : <p className="text-xs text-muted-foreground">No expenses</p>}

      <div className="flex items-center justify-between pt-2 border-t">
        <Label className="text-xs font-medium">Accessorial ({accessorialCharges.length})</Label>
        {canEdit && <Button variant="ghost" size="sm" onClick={onShowAccessorialForm} className="h-6 text-xs px-2"><Plus className="h-3 w-3 mr-1" />Add</Button>}
      </div>
      {accessorialCharges.length > 0 ? (
        <div className="space-y-1">
          {accessorialCharges.slice(0, 3).map((charge: any) => (
            <div key={charge.id} className="flex justify-between text-xs p-1.5 bg-muted/30 rounded">
              <span>{charge.chargeType?.replace(/_/g, ' ')}</span>
              <span className="font-medium">{formatCurrency(charge.amount)}</span>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground">No accessorial charges</p>}

      <div className="flex items-center justify-between pt-2 border-t">
        <Label className="text-xs font-medium">Rate Confirmation</Label>
        {canEdit && <Button variant="ghost" size="sm" onClick={onShowRateConForm} className="h-6 text-xs px-2"><FileText className="h-3 w-3 mr-1" />{load.rateConfirmation ? 'Edit' : 'Add'}</Button>}
      </div>
      {load.rateConfirmation ? (
        <div className="flex justify-between text-xs p-1.5 bg-muted/30 rounded">
          <span>#{load.rateConfirmation.rateConfNumber || 'N/A'}</span>
          <span className="font-medium">{formatCurrency(load.rateConfirmation.totalRate)}</span>
        </div>
      ) : <p className="text-xs text-muted-foreground">No rate confirmation</p>}
    </div>
  );
}

/* ─── Notes Tab Content ─── */
function NotesContent({ load, formData, canEdit, updateField }: {
  load: any; formData: any; canEdit: boolean; updateField: (f: string, v: any) => void;
}) {
  return canEdit ? (
    <textarea
      value={formData.dispatchNotes || load.dispatchNotes || ''}
      onChange={(e) => updateField('dispatchNotes', e.target.value)}
      className="w-full min-h-[80px] p-2 text-xs border border-input bg-background text-foreground rounded resize-none"
      placeholder="Dispatch notes..."
    />
  ) : (
    <p className="text-xs whitespace-pre-wrap">{load.dispatchNotes || '—'}</p>
  );
}
