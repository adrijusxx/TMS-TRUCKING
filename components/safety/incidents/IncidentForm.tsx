'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiUrl } from '@/lib/utils';

interface IncidentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function IncidentForm({ onSuccess, onCancel, initialData }: IncidentFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    incidentType: initialData?.incidentType || 'ACCIDENT',
    severity: initialData?.severity || 'MEDIUM',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    location: initialData?.location || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    description: initialData?.description || '',
    driverId: initialData?.driverId || '',
    truckId: initialData?.truckId || '',
    loadId: initialData?.loadId || '',
    injuriesInvolved: initialData?.injuriesInvolved || false,
    fatalitiesInvolved: initialData?.fatalitiesInvolved || false,
    estimatedCost: initialData?.estimatedCost || ''
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = initialData
        ? apiUrl(`/api/safety/incidents/${initialData.id}`)
        : apiUrl('/api/safety/incidents');
      const method = initialData ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save incident');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Incident' : 'Report New Incident'}</CardTitle>
          <CardDescription>
            {initialData ? 'Update incident details' : 'Report a safety incident or accident'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select
                value={formData.incidentType}
                onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="INCIDENT">Incident</SelectItem>
                  <SelectItem value="VIOLATION">Violation</SelectItem>
                  <SelectItem value="NEAR_MISS">Near Miss</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Incident location"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what happened"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Estimated Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="injuries"
                checked={formData.injuriesInvolved}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, injuriesInvolved: checked as boolean })
                }
              />
              <Label htmlFor="injuries" className="font-normal cursor-pointer">
                Injuries Involved
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fatalities"
                checked={formData.fatalitiesInvolved}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, fatalitiesInvolved: checked as boolean })
                }
              />
              <Label htmlFor="fatalities" className="font-normal cursor-pointer">
                Fatalities Involved
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : initialData ? 'Update Incident' : 'Report Incident'}
        </Button>
      </div>
    </form>
  );
}

