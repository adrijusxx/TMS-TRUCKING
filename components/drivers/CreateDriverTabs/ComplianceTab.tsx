'use client';

import { useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ComplianceTabProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
}

const ENDORSEMENT_OPTIONS = [
  'N - Tank Vehicles',
  'T - Doubles/Triples',
  'H - Hazardous Materials',
  'X - Tank + Hazmat',
  'P - Passenger',
  'S - School Bus',
];

export function ComplianceTab({ register, setValue, watch, errors }: ComplianceTabProps) {
  const [endorsements, setEndorsements] = useState<string[]>(watch('endorsements') || []);

  const handleAddEndorsement = (value: string) => {
    if (!endorsements.includes(value)) {
      const next = [...endorsements, value];
      setEndorsements(next);
      setValue('endorsements', next);
    }
  };

  const handleRemoveEndorsement = (value: string) => {
    const next = endorsements.filter((e) => e !== value);
    setEndorsements(next);
    setValue('endorsements', next);
  };

  return (
    <Card>
      <CardHeader><CardTitle>License & Compliance</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input id="licenseNumber" placeholder="TX-123456" {...register('licenseNumber')} />
            {errors.licenseNumber && <p className="text-sm text-destructive">{errors.licenseNumber.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseState">License State *</Label>
            <Input id="licenseState" placeholder="TX" maxLength={2} {...register('licenseState')} />
            {errors.licenseState && <p className="text-sm text-destructive">{errors.licenseState.message as string}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseIssueDate">License Issue Date</Label>
            <Input id="licenseIssueDate" type="date" {...register('licenseIssueDate')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseExpiry">License Expiry *</Label>
            <Input id="licenseExpiry" type="date" {...register('licenseExpiry')} />
            {errors.licenseExpiry && <p className="text-sm text-destructive">{errors.licenseExpiry.message as string}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dlClass">DL Class</Label>
            <Select value={watch('dlClass') || ''} onValueChange={(v) => setValue('dlClass', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="driverType">Driver Type</Label>
            <Select value={watch('driverType') || ''} onValueChange={(v) => setValue('driverType', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPANY_DRIVER">Company Driver</SelectItem>
                <SelectItem value="LEASE">Lease</SelectItem>
                <SelectItem value="OWNER_OPERATOR">Owner Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cdlExperience">CDL Experience</Label>
            <Input id="cdlExperience" {...register('cdlExperience')} placeholder="e.g., 5 years" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restrictions">Restrictions</Label>
            <Input id="restrictions" {...register('restrictions')} placeholder="e.g., None" />
          </div>
        </div>

        {/* Endorsements */}
        <div className="space-y-2">
          <Label>Endorsements</Label>
          <div className="flex flex-wrap gap-2">
            {endorsements.map((e) => (
              <Badge key={e} variant="secondary" className="flex items-center gap-1">
                {e}
                <button type="button" onClick={() => handleRemoveEndorsement(e)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Select onValueChange={handleAddEndorsement}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Add endorsement" />
              </SelectTrigger>
              <SelectContent>
                {ENDORSEMENT_OPTIONS.filter((o) => !endorsements.includes(o)).map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medicalCardExpiry">Medical Card Expiry *</Label>
            <Input id="medicalCardExpiry" type="date" {...register('medicalCardExpiry')} />
            {errors.medicalCardExpiry && <p className="text-sm text-destructive">{errors.medicalCardExpiry.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="driverFacingCamera">Driver Facing Camera</Label>
            <Select value={watch('driverFacingCamera') || ''} onValueChange={(v) => setValue('driverFacingCamera', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="drugTestDate">Drug Test Date</Label>
            <Input id="drugTestDate" type="date" {...register('drugTestDate')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backgroundCheck">Background Check</Label>
            <Input id="backgroundCheck" type="date" {...register('backgroundCheck')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
