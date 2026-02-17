'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings2, Users, FileText } from 'lucide-react';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import type { CreateLoadInput } from '@/lib/validations/load';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';

interface AdditionalFieldsSectionProps {
  loadData: Partial<CreateLoadInput>;
  onFieldChange: (field: keyof CreateLoadInput, value: any) => void;
  errors?: Record<string, string>;
}

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

export default function AdditionalFieldsSection({
  loadData,
  onFieldChange,
  errors = {},
}: AdditionalFieldsSectionProps) {
  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'additional-fields'],
    queryFn: fetchDrivers,
  });

  const drivers = driversData?.data || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Additional Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Co-Driver Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Team Driver</h4>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coDriverId" className="text-sm">
              Co-Driver (Optional)
            </Label>
            <DriverCombobox
              value={loadData.coDriverId || ''}
              onValueChange={(value) => onFieldChange('coDriverId', value || undefined)}
              placeholder="Select co-driver for team loads..."
              drivers={drivers}
            />
            <p className="text-xs text-muted-foreground">
              Assign a co-driver for team driving loads
            </p>
          </div>
        </div>

        {/* Reference IDs */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Reference Numbers</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgency" className="text-sm">
                Urgency
              </Label>
              <select
                id="urgency"
                value={loadData.urgency ?? 'NORMAL'}
                onChange={(e) => onFieldChange('urgency', e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipmentId" className="text-sm">
                Shipment ID
              </Label>
              <Input
                id="shipmentId"
                value={(loadData as any).shipmentId ?? ''}
                onChange={(e) => onFieldChange('shipmentId' as any, e.target.value || undefined)}
                placeholder="External shipment reference"
              />
            </div>
          </div>
        </div>

        {/* Dispatch Notes */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="dispatchNotes" className="text-sm">
              Dispatch Notes
            </Label>
            <Textarea
              id="dispatchNotes"
              value={loadData.dispatchNotes || ''}
              onChange={(e) => onFieldChange('dispatchNotes', e.target.value)}
              rows={3}
              placeholder="Special instructions, load requirements, driver notes..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

