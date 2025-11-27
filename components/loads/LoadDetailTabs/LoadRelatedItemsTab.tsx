'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, FileText, MapPin, MessageSquare, Truck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import LoadMap from '../LoadMap';
import LoadSegments from '../LoadSegments';
import AccessorialChargeForm from '@/components/accessorial/AccessorialChargeForm';
import RateConfirmationForm from '@/components/rate-confirmations/RateConfirmationForm';
import { apiUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface LoadRelatedItemsTabProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
  availableDrivers?: any[];
  availableTrucks?: any[];
}

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

export default function LoadRelatedItemsTab({
  load,
  formData,
  onFormDataChange,
  availableDrivers = [],
  availableTrucks = [],
}: LoadRelatedItemsTabProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAccessorialForm, setShowAccessorialForm] = useState(false);
  const [showRateConForm, setShowRateConForm] = useState(false);

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
    <div className="space-y-4">
      {/* Route Map */}
      {((load.stops && load.stops.length > 0) ||
        (load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState)) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Route Map</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <LoadMap load={load} compact={false} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Expenses</CardTitle>
              {expenses.length > 0 && (
                <Badge variant="secondary">{expenses.length}</Badge>
              )}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExpenseForm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Expense
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{expense.expenseType}</p>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {expense.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
              {expensesData?.data?.totalExpenses && (
                <div className="pt-2 mt-2 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold">Total Expenses</Label>
                    <p className="font-bold">{formatCurrency(expensesData.data.totalExpenses)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No expenses recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Accessorial Charges */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Accessorial Charges</CardTitle>
              {accessorialCharges.length > 0 && (
                <Badge variant="secondary">{accessorialCharges.length}</Badge>
              )}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAccessorialForm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Charge
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {accessorialCharges.length > 0 ? (
            <div className="space-y-2">
              {accessorialCharges.map((charge: any) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{charge.chargeType.replace(/_/g, ' ')}</p>
                      <Badge variant="outline" className="text-xs">
                        {charge.status}
                      </Badge>
                    </div>
                    {charge.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {charge.description}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(charge.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No accessorial charges
            </p>
          )}
          {canEdit && (
            <AccessorialChargeForm
              open={showAccessorialForm}
              onOpenChange={setShowAccessorialForm}
              loadId={load.id}
              onSuccess={() => {
                setShowAccessorialForm(false);
                window.location.reload();
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Rate Confirmation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Rate Confirmation</CardTitle>
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRateConForm(true)}
              >
                {load.rateConfirmation ? (
                  <>
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {load.rateConfirmation ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Rate Conf #</Label>
                  <p className="font-medium text-sm mt-1">
                    {load.rateConfirmation.rateConfNumber || '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Rate</Label>
                  <p className="font-medium text-sm mt-1">
                    {formatCurrency(load.rateConfirmation.totalRate)}
                  </p>
                </div>
              </div>
              {load.rateConfirmation.baseRate && (
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground">Base Rate</Label>
                  <p className="font-medium text-sm mt-1">
                    {formatCurrency(load.rateConfirmation.baseRate)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rate confirmation on file
            </p>
          )}
          {canEdit && (
            <RateConfirmationForm
              open={showRateConForm}
              onOpenChange={setShowRateConForm}
              loadId={load.id}
              confirmationId={load.rateConfirmation?.id}
              onSuccess={() => {
                setShowRateConForm(false);
                window.location.reload();
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Load Segments */}
      {load.segments && load.segments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Load Segments ({load.segments.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <LoadSegments
              loadId={load.id}
              segments={load.segments || []}
              availableDrivers={availableDrivers}
              availableTrucks={availableTrucks}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      )}

      {/* Driver Advances */}
      {load.driverAdvances && load.driverAdvances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Driver Advances ({load.driverAdvances.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {load.driverAdvances.map((advance: any) => (
                <div
                  key={advance.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {formatCurrency(advance.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requested: {formatDate(advance.requestDate)}
                    </p>
                    {advance.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {advance.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant={advance.paidAt ? 'default' : 'secondary'}>
                    {advance.paidAt ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dispatchNotes" className="text-sm">Dispatch Notes</Label>
            {canEdit ? (
              <textarea
                id="dispatchNotes"
                value={formData.dispatchNotes || load.dispatchNotes || ''}
                onChange={(e) => updateField('dispatchNotes', e.target.value)}
                className="w-full min-h-[100px] p-2 text-sm border rounded-md resize-none"
                placeholder="Dispatch notes..."
              />
            ) : (
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {load.dispatchNotes || '—'}
              </p>
            )}
          </div>

          {load.driverNotes && (
            <div className="space-y-2">
              <Label className="text-sm">Driver Notes</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{load.driverNotes}</p>
            </div>
          )}

          {load.lastNote && (
            <div className="space-y-2">
              <Label className="text-sm">Last Note</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{load.lastNote}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

