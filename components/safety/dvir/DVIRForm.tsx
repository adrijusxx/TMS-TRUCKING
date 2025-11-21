'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiUrl } from '@/lib/utils';

interface DVIRFormProps {
  vehicleId: string;
  driverId: string;
  onSuccess?: () => void;
}

export default function DVIRForm({ vehicleId, driverId, onSuccess }: DVIRFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    inspectionType: 'PRE_TRIP',
    inspectionDate: new Date().toISOString().split('T')[0],
    location: '',
    latitude: '',
    longitude: '',
    brakesOk: true,
    tiresOk: true,
    lightsOk: true,
    couplingOk: true,
    steeringOk: true,
    suspensionOk: true,
    frameOk: true,
    cargoSecurementOk: true,
    emergencyEquipmentOk: true,
    vehicleNeedsRepair: false,
    defects: [] as Array<{
      inspectionPoint: string;
      description: string;
      severity: string;
      location: string;
    }>
  });

  const [currentDefect, setCurrentDefect] = useState({
    inspectionPoint: '',
    description: '',
    severity: 'NON_CRITICAL',
    location: ''
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/vehicles/${vehicleId}/dvir`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create DVIR');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dvirs', vehicleId] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      driverId,
      inspectionDate: formData.inspectionDate,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      vehicleNeedsRepair: formData.defects.length > 0
    });
  };

  const addDefect = () => {
    if (currentDefect.inspectionPoint && currentDefect.description) {
      setFormData({
        ...formData,
        defects: [...formData.defects, currentDefect],
        vehicleNeedsRepair: true
      });
      setCurrentDefect({
        inspectionPoint: '',
        description: '',
        severity: 'NON_CRITICAL',
        location: ''
      });
    }
  };

  const removeDefect = (index: number) => {
    setFormData({
      ...formData,
      defects: formData.defects.filter((_, i) => i !== index),
      vehicleNeedsRepair: formData.defects.length > 1
    });
  };

  const INSPECTION_POINTS = [
    'Brakes',
    'Tires',
    'Lights',
    'Coupling Devices',
    'Steering',
    'Suspension',
    'Frame',
    'Cargo Securement',
    'Emergency Equipment',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DVIR Information</CardTitle>
          <CardDescription>Driver Vehicle Inspection Report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inspection Type</Label>
              <Select
                value={formData.inspectionType}
                onValueChange={(value) => setFormData({ ...formData, inspectionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRE_TRIP">Pre-Trip</SelectItem>
                  <SelectItem value="POST_TRIP">Post-Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Inspection Date</Label>
              <Input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Inspection location"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Points</CardTitle>
          <CardDescription>Check all inspection points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'brakesOk', label: 'Brakes' },
            { key: 'tiresOk', label: 'Tires' },
            { key: 'lightsOk', label: 'Lights' },
            { key: 'couplingOk', label: 'Coupling Devices' },
            { key: 'steeringOk', label: 'Steering' },
            { key: 'suspensionOk', label: 'Suspension' },
            { key: 'frameOk', label: 'Frame' },
            { key: 'cargoSecurementOk', label: 'Cargo Securement' },
            { key: 'emergencyEquipmentOk', label: 'Emergency Equipment' }
          ].map((point) => (
            <div key={point.key} className="flex items-center space-x-2">
              <Checkbox
                id={point.key}
                checked={formData[point.key as keyof typeof formData] as boolean}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, [point.key]: checked })
                }
              />
              <Label htmlFor={point.key} className="font-normal cursor-pointer">
                {point.label} - OK
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {formData.defects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Defects Reported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.defects.map((defect, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{defect.inspectionPoint}</div>
                    <div className="text-sm text-muted-foreground">{defect.description}</div>
                    <div className="text-xs text-muted-foreground">
                      Severity: {defect.severity.replace('_', ' ')}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDefect(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Defect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Inspection Point</Label>
            <Select
              value={currentDefect.inspectionPoint}
              onValueChange={(value) =>
                setCurrentDefect({ ...currentDefect, inspectionPoint: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select inspection point" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_POINTS.map((point) => (
                  <SelectItem key={point} value={point}>
                    {point}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={currentDefect.description}
              onChange={(e) =>
                setCurrentDefect({ ...currentDefect, description: e.target.value })
              }
              placeholder="Describe the defect"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={currentDefect.severity}
                onValueChange={(value) =>
                  setCurrentDefect({ ...currentDefect, severity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="NON_CRITICAL">Non-Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={currentDefect.location}
                onChange={(e) =>
                  setCurrentDefect({ ...currentDefect, location: e.target.value })
                }
                placeholder="Defect location"
              />
            </div>
          </div>

          <Button type="button" onClick={addDefect} variant="outline">
            Add Defect
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Submitting...' : 'Submit DVIR'}
        </Button>
      </div>
    </form>
  );
}

