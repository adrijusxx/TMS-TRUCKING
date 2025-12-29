'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface DriverComplianceTabProps {
  driver: any;
  onSave: (data: any) => void;
}

export default function DriverComplianceTab({
  driver,
  onSave,
}: DriverComplianceTabProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      driverLicenseId: driver.licenseNumber || '',
      driverLicenseExpiration: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
      driverLicenseState: driver.licenseState || '',
      totalCdlExperience: driver.cdlExperience || '',
      restrictions: driver.restrictions || '',
      dlClass: driver.dlClass || '',
      driverType: driver.driverType || 'COMPANY_DRIVER',
      medCardLicenseExpiration: driver.medicalCardExpiry ? new Date(driver.medicalCardExpiry).toISOString().split('T')[0] : '',
      driverLicenseIssueDate: driver.licenseIssueDate ? new Date(driver.licenseIssueDate).toISOString().split('T')[0] : '',
      endorsements: driver.endorsements || [],
      driverFacingCamera: driver.driverFacingCamera || 'No',
    },
  });

  const [endorsements, setEndorsements] = useState<string[]>(watch('endorsements') || []);

  const endorsementOptions = [
    'N - Tank Vehicles',
    'T - Doubles/Triples',
    'H - Hazardous Materials',
    'X - Tank + Hazmat',
    'P - Passenger',
    'S - School Bus',
  ];

  const onSubmit = (data: any) => {
    const apiData: any = {
      licenseNumber: data.driverLicenseId,
      licenseExpiry: data.driverLicenseExpiration || undefined,
      licenseState: data.driverLicenseState,
      cdlExperience: data.totalCdlExperience,
      restrictions: data.restrictions,
      dlClass: data.dlClass,
      driverType: data.driverType,
      medicalCardExpiry: data.medCardLicenseExpiration || undefined,
      licenseIssueDate: data.driverLicenseIssueDate || undefined,
      endorsements,
      driverFacingCamera: data.driverFacingCamera,
    };

    onSave(apiData);
  };

  // Save when main Save button is clicked
  useEffect(() => {
    const handleSave = () => {
      handleSubmit(onSubmit)();
    };
    
    window.addEventListener('driver-form-save', handleSave);
    return () => window.removeEventListener('driver-form-save', handleSave);
  }, [handleSubmit, endorsements]);

  return (
    <form id="driver-compliance-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>License & Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driverLicenseId">Driver License ID</Label>
              <Input id="driverLicenseId" {...register('driverLicenseId')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverLicenseState">Driver License State</Label>
              <Select
                value={watch('driverLicenseState')}
                onValueChange={(value) => setValue('driverLicenseState', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WA">Washington - WA</SelectItem>
                  <SelectItem value="CA">California - CA</SelectItem>
                  <SelectItem value="TX">Texas - TX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driverLicenseIssueDate">License Issue Date</Label>
              <Input id="driverLicenseIssueDate" type="date" {...register('driverLicenseIssueDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverLicenseExpiration">License Expiration</Label>
              <Input id="driverLicenseExpiration" type="date" {...register('driverLicenseExpiration')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dlClass">DL Class</Label>
              <Select
                value={watch('dlClass')}
                onValueChange={(value) => setValue('dlClass', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverType">Driver Type</Label>
              <Select
                value={watch('driverType')}
                onValueChange={(value) => setValue('driverType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPANY_DRIVER">Company driver</SelectItem>
                  <SelectItem value="LEASE">Lease</SelectItem>
                  <SelectItem value="OWNER_OPERATOR">Owner operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCdlExperience">Total CDL Experience</Label>
            <Input id="totalCdlExperience" {...register('totalCdlExperience')} placeholder="e.g., 5 years" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restrictions">Restrictions</Label>
            <Input id="restrictions" {...register('restrictions')} placeholder="e.g., None, Glasses required" />
          </div>

          <div className="space-y-2">
            <Label>Endorsements</Label>
            <div className="flex flex-wrap gap-2">
              {endorsements.map((endorsement) => (
                <Badge key={endorsement} variant="secondary" className="flex items-center gap-1">
                  {endorsement}
                  <button
                    type="button"
                    onClick={() => setEndorsements(endorsements.filter((e) => e !== endorsement))}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Select
                onValueChange={(value) => {
                  if (!endorsements.includes(value)) {
                    setEndorsements([...endorsements, value]);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Add endorsement" />
                </SelectTrigger>
                <SelectContent>
                  {endorsementOptions
                    .filter((opt) => !endorsements.includes(opt))
                    .map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medCardLicenseExpiration">Medical Card Expiration</Label>
              <Input id="medCardLicenseExpiration" type="date" {...register('medCardLicenseExpiration')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverFacingCamera">Driver Facing Camera</Label>
              <Select
                value={watch('driverFacingCamera')}
                onValueChange={(value) => setValue('driverFacingCamera', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

