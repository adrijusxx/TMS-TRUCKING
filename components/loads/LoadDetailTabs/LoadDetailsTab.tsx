'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadStatus, LoadType, EquipmentType } from '@prisma/client';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import DispatcherCombobox from '@/components/users/DispatcherCombobox';
import {
  Package, User, Truck, ChevronDown, ChevronUp, AlertTriangle,
  MessageSquare, FileText, Plus, DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import AccessorialChargeForm from '@/components/accessorial/AccessorialChargeForm';
import RateConfirmationForm from '@/components/rate-confirmations/RateConfirmationForm';
import LoadSegments from '../LoadSegments';
import { apiUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface LoadDetailsTabProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
  availableDrivers?: any[];
  availableTrucks?: any[];
  customers?: any[];
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

export default function LoadDetailsTab({
  load,
  formData,
  onFormDataChange,
  availableDrivers = [],
  availableTrucks = [],
  customers = [],
}: LoadDetailsTabProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');
  const [specsOpen, setSpecsOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
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
      {/* Assignment Section - Compact Grid */}
      <Card className="shadow-sm">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Assignment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3">
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            {canEdit ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Truck</Label>
                  <TruckCombobox
                    value={formData.truckId || ''}
                    onValueChange={(value) => updateField('truckId', value)}
                    placeholder="Search..."
                    trucks={availableTrucks}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Trailer</Label>
                  <TrailerCombobox
                    value={formData.trailerId || formData.trailerNumber || ''}
                    onValueChange={(value) => updateField('trailerId', value)}
                    placeholder="Search..."
                    className="h-7 text-xs"
                    selectedTrailer={load.trailer}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Driver</Label>
                  <DriverCombobox
                    value={formData.driverId || ''}
                    onValueChange={(value) => updateField('driverId', value)}
                    placeholder="Search..."
                    drivers={availableDrivers}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Co-Driver</Label>
                  <DriverCombobox
                    value={formData.coDriverId || ''}
                    onValueChange={(value) => updateField('coDriverId', value)}
                    placeholder="Optional"
                    drivers={availableDrivers}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dispatcher</Label>
                  <DispatcherCombobox
                    value={formData.dispatcherId || ''}
                    onValueChange={(value) => updateField('dispatcherId', value)}
                    placeholder="Search..."
                    className="h-7 text-xs"
                  />
                </div>
              </>
            ) : (
              <>
                {load.truck && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Truck</Label>
                    <p className="text-xs font-medium">#{load.truck.truckNumber}</p>
                  </div>
                )}
                {(load.trailer || load.trailerNumber) && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Trailer</Label>
                    <p className="text-xs font-medium">{load.trailer?.trailerNumber || load.trailerNumber}</p>
                  </div>
                )}
                {load.driver && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Driver</Label>
                    <p className="text-xs font-medium">
                      {load.driver.user.firstName} {load.driver.user.lastName}
                    </p>
                  </div>
                )}
                {load.coDriver && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Co-Driver</Label>
                    <p className="text-xs font-medium">
                      {load.coDriver.user.firstName} {load.coDriver.user.lastName}
                    </p>
                  </div>
                )}
                {load.dispatcher && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Dispatcher</Label>
                    <p className="text-xs font-medium">
                      {load.dispatcher.firstName} {load.dispatcher.lastName}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Load Details - Compact Grid */}
      <Card className="shadow-sm">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Load Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3">
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              {canEdit ? (
                <Select
                  value={formData.status || load.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LoadStatus).map((status) => (
                      <SelectItem key={status} value={status} className="text-xs">
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs font-medium">{load.status?.replace(/_/g, ' ')}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Load Type</Label>
              {canEdit ? (
                <Select
                  value={formData.loadType || load.loadType}
                  onValueChange={(value) => updateField('loadType', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LoadType).map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs font-medium">{load.loadType}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Equipment</Label>
              {canEdit ? (
                <Select
                  value={formData.equipmentType || load.equipmentType}
                  onValueChange={(value) => updateField('equipmentType', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EquipmentType).map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs font-medium">{load.equipmentType?.replace(/_/g, ' ')}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Customer</Label>
              {canEdit ? (
                <CustomerCombobox
                  value={formData.customerId || load.customerId}
                  onValueChange={(value) => updateField('customerId', value)}
                  placeholder="Search..."
                  customers={customers}
                  className="h-7 text-xs"
                />
              ) : (
                <p className="text-xs font-medium">{load.customer?.name || '—'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specifications - Collapsible */}
      <Collapsible open={specsOpen} onOpenChange={setSpecsOpen}>
        <Card className="shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Specifications</CardTitle>
                  {load.hazmat && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1">HAZMAT</Badge>
                  )}
                </div>
                {specsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="py-2 px-3 border-t">
              <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Weight (lbs)</Label>
                  {canEdit ? (
                    <Input
                      type="number"
                      value={formData.weight || load.weight || ''}
                      onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.weight?.toLocaleString() || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pieces</Label>
                  {canEdit ? (
                    <Input
                      type="number"
                      value={formData.pieces || load.pieces || ''}
                      onChange={(e) => updateField('pieces', e.target.value ? parseInt(e.target.value) : null)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pieces || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pallets</Label>
                  {canEdit ? (
                    <Input
                      type="number"
                      value={formData.pallets || load.pallets || ''}
                      onChange={(e) => updateField('pallets', e.target.value ? parseInt(e.target.value) : null)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pallets || '—'}</p>
                  )}
                </div>
                {(isReefer || load.temperature) && (
                  <div className="space-y-1">
                    <Label className="text-xs">Temp (°F)</Label>
                    {canEdit ? (
                      <Input
                        type="number"
                        value={formData.temperature || load.temperature || ''}
                        onChange={(e) => updateField('temperature', e.target.value || null)}
                        className="h-7 text-xs"
                      />
                    ) : (
                      <p className="text-xs font-medium">{load.temperature ? `${load.temperature}°F` : '—'}</p>
                    )}
                  </div>
                )}
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Commodity</Label>
                  {canEdit ? (
                    <Input
                      value={formData.commodity || load.commodity || ''}
                      onChange={(e) => updateField('commodity', e.target.value || null)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.commodity || '—'}</p>
                  )}
                </div>
                <div className="space-y-1 col-span-2 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs">Hazmat</Label>
                  {canEdit ? (
                    <input
                      type="checkbox"
                      checked={formData.hazmat ?? load.hazmat ?? false}
                      onChange={(e) => updateField('hazmat', e.target.checked)}
                      className="h-3.5 w-3.5"
                    />
                  ) : (
                    <span className="text-xs">{load.hazmat ? 'Yes' : 'No'}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Charges & Rate Con - Collapsible */}
      <Collapsible open={chargesOpen} onOpenChange={setChargesOpen}>
        <Card className="shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Charges & Rate Con</CardTitle>
                  {(expenses.length > 0 || accessorialCharges.length > 0) && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {expenses.length + accessorialCharges.length}
                    </Badge>
                  )}
                </div>
                {chargesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="py-2 px-3 border-t space-y-3">
              {/* Expenses */}
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
                  {expenses.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+{expenses.length - 3} more</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No expenses</p>
              )}

              {/* Accessorial Charges */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-xs font-medium">Accessorial ({accessorialCharges.length})</Label>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAccessorialForm(true)} className="h-6 text-xs px-2">
                    <Plus className="h-3 w-3 mr-1" />Add
                  </Button>
                )}
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
              ) : (
                <p className="text-xs text-muted-foreground">No accessorial charges</p>
              )}

              {/* Rate Confirmation */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-xs font-medium">Rate Confirmation</Label>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => setShowRateConForm(true)} className="h-6 text-xs px-2">
                    <FileText className="h-3 w-3 mr-1" />{load.rateConfirmation ? 'Edit' : 'Add'}
                  </Button>
                )}
              </div>
              {load.rateConfirmation ? (
                <div className="flex justify-between text-xs p-1.5 bg-muted/30 rounded">
                  <span>#{load.rateConfirmation.rateConfNumber || 'N/A'}</span>
                  <span className="font-medium">{formatCurrency(load.rateConfirmation.totalRate)}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No rate confirmation</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Notes - Compact */}
      <Card className="shadow-sm">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3">
          {canEdit ? (
            <textarea
              value={formData.dispatchNotes || load.dispatchNotes || ''}
              onChange={(e) => updateField('dispatchNotes', e.target.value)}
              className="w-full min-h-[60px] p-2 text-xs border rounded resize-none"
              placeholder="Dispatch notes..."
            />
          ) : (
            <p className="text-xs whitespace-pre-wrap">{load.dispatchNotes || '—'}</p>
          )}
        </CardContent>
      </Card>

      {/* Load Segments */}
      {
        load.segments && load.segments.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="py-2 px-3">
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Segments ({load.segments.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <LoadSegments
                loadId={load.id}
                segments={load.segments || []}
                availableDrivers={availableDrivers}
                availableTrucks={availableTrucks}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        )
      }

      {/* Dialogs */}
      {
        canEdit && (
          <>
            <AccessorialChargeForm
              open={showAccessorialForm}
              onOpenChange={setShowAccessorialForm}
              loadId={load.id}
              onSuccess={() => {
                setShowAccessorialForm(false);
                window.location.reload();
              }}
            />
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
          </>
        )
      }
    </div >
  );
}





