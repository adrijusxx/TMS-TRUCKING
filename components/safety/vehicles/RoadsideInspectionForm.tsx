'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface RoadsideInspectionFormProps {
  vehicleId: string;
  driverId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const INSPECTION_LEVELS = [
  { value: 'LEVEL_1', label: 'Level I - Full Inspection' },
  { value: 'LEVEL_2', label: 'Level II - Walk-Around Inspection' },
  { value: 'LEVEL_3', label: 'Level III - Driver-Only Inspection' },
  { value: 'LEVEL_4', label: 'Level IV - Special Inspection' },
  { value: 'LEVEL_5', label: 'Level V - Vehicle-Only Inspection' },
  { value: 'LEVEL_6', label: 'Level VI - Enhanced NAS Inspection' }
];

const BASIC_CATEGORIES = [
  'UNSAFE_DRIVING',
  'CRASH_INDICATOR',
  'HOS_COMPLIANCE',
  'VEHICLE_MAINTENANCE',
  'CONTROLLED_SUBSTANCES',
  'HAZMAT_COMPLIANCE',
  'DRIVER_FITNESS'
];

export default function RoadsideInspectionForm({
  vehicleId,
  driverId,
  onSuccess,
  onCancel
}: RoadsideInspectionFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionLocation: '',
    inspectionState: '',
    inspectionLevel: 'LEVEL_1',
    inspectorName: '',
    inspectorBadgeNumber: '',
    violationsFound: false,
    outOfService: false,
    oosReason: '',
    requiredCorrectiveAction: '',
    violations: [] as Array<{
      violationCode: string;
      violationDescription: string;
      severityWeight: string;
      basicCategory: string;
    }>
  });
  const [currentViolation, setCurrentViolation] = useState({
    violationCode: '',
    violationDescription: '',
    severityWeight: '',
    basicCategory: ''
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/vehicles/${vehicleId}/roadside-inspections`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create roadside inspection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadside-inspections', vehicleId] });
      onSuccess?.();
    }
  });

  const addViolation = () => {
    if (currentViolation.violationCode && currentViolation.violationDescription) {
      setFormData({
        ...formData,
        violations: [...formData.violations, currentViolation],
        violationsFound: true
      });
      setCurrentViolation({
        violationCode: '',
        violationDescription: '',
        severityWeight: '',
        basicCategory: ''
      });
    }
  };

  const removeViolation = (index: number) => {
    const newViolations = formData.violations.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      violations: newViolations,
      violationsFound: newViolations.length > 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      driverId,
      inspectionDate: formData.inspectionDate,
      violations: formData.violations.map(v => ({
        ...v,
        severityWeight: v.severityWeight ? parseFloat(v.severityWeight) : null
      }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roadside Inspection</CardTitle>
          <CardDescription>Record roadside inspection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inspection Date *</Label>
              <Input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Inspection Level *</Label>
              <Select
                value={formData.inspectionLevel}
                onValueChange={(value) => setFormData({ ...formData, inspectionLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input
                value={formData.inspectionLocation}
                onChange={(e) =>
                  setFormData({ ...formData, inspectionLocation: e.target.value })
                }
                placeholder="Inspection location"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                value={formData.inspectionState}
                onChange={(e) => setFormData({ ...formData, inspectionState: e.target.value })}
                maxLength={2}
                placeholder="State code"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inspector Name</Label>
              <Input
                value={formData.inspectorName}
                onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                placeholder="Inspector name"
              />
            </div>
            <div className="space-y-2">
              <Label>Inspector Badge Number</Label>
              <Input
                value={formData.inspectorBadgeNumber}
                onChange={(e) =>
                  setFormData({ ...formData, inspectorBadgeNumber: e.target.value })
                }
                placeholder="Badge number"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="violationsFound"
                checked={formData.violationsFound}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, violationsFound: checked as boolean })
                }
              />
              <Label htmlFor="violationsFound" className="font-normal cursor-pointer">
                Violations Found
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="outOfService"
                checked={formData.outOfService}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, outOfService: checked as boolean })
                }
              />
              <Label htmlFor="outOfService" className="font-normal cursor-pointer">
                Out of Service
              </Label>
            </div>
          </div>

          {formData.outOfService && (
            <div className="space-y-2">
              <Label>OOS Reason</Label>
              <Textarea
                value={formData.oosReason}
                onChange={(e) => setFormData({ ...formData, oosReason: e.target.value })}
                placeholder="Reason for out of service"
                rows={2}
              />
            </div>
          )}

          {formData.outOfService && (
            <div className="space-y-2">
              <Label>Required Corrective Action</Label>
              <Textarea
                value={formData.requiredCorrectiveAction}
                onChange={(e) =>
                  setFormData({ ...formData, requiredCorrectiveAction: e.target.value })
                }
                placeholder="Required corrective action"
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violations */}
      {formData.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.violations.map((violation, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{violation.violationCode}</div>
                    <div className="text-sm text-muted-foreground">
                      {violation.violationDescription}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      BASIC: {violation.basicCategory.replace(/_/g, ' ')}
                      {violation.severityWeight && ` • Weight: ${violation.severityWeight}`}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeViolation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Violation */}
      {formData.violationsFound && (
        <Card>
          <CardHeader>
            <CardTitle>Add Violation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Violation Code *</Label>
                <Input
                  value={currentViolation.violationCode}
                  onChange={(e) =>
                    setCurrentViolation({ ...currentViolation, violationCode: e.target.value })
                  }
                  placeholder="e.g., 395.3"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Severity Weight</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={currentViolation.severityWeight}
                  onChange={(e) =>
                    setCurrentViolation({ ...currentViolation, severityWeight: e.target.value })
                  }
                  placeholder="Severity weight"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>BASIC Category</Label>
              <Select
                value={currentViolation.basicCategory}
                onValueChange={(value) =>
                  setCurrentViolation({ ...currentViolation, basicCategory: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select BASIC category" />
                </SelectTrigger>
                <SelectContent>
                  {BASIC_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Violation Description *</Label>
              <Textarea
                value={currentViolation.violationDescription}
                onChange={(e) =>
                  setCurrentViolation({
                    ...currentViolation,
                    violationDescription: e.target.value
                  })
                }
                placeholder="Describe the violation"
                rows={3}
                required
              />
            </div>

            <Button type="button" onClick={addViolation} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Violation
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Submitting...' : 'Submit Inspection'}
        </Button>
      </div>
    </form>
  );
}

