'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DriverTruckHistoryTable from './DriverTruckHistoryTable';
import DriverTrailerHistoryTable from './DriverTrailerHistoryTable';
import DriverCommentsSection from './DriverCommentsSection';

interface DriverMainTabProps {
  driver: any;
  trucks: Array<{ id: string; truckNumber: string }>;
  trailers: Array<{ id: string; trailerNumber: string }>;
  dispatchers: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  onSave: (data: any) => void;
}

export default function DriverMainTab({
  driver,
  trucks,
  trailers,
  dispatchers,
  users,
  onSave,
}: DriverMainTabProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      firstName: driver.user.firstName || '',
      lastName: driver.user.lastName || '',
      contactNumber: driver.user.phone || '',
      socialSecurityNumber: driver.socialSecurityNumber || '',
      employmentStatus: driver.employeeStatus || 'ACTIVE',
      emailAddress: driver.user.email || '',
      tenureAtCompany: driver.tenure || '',
      birthDate: driver.birthDate ? new Date(driver.birthDate).toISOString().split('T')[0] : '',
      telegramNumber: driver.telegramNumber || '',
      gender: driver.gender || '',
      maritalStatus: driver.maritalStatus || '',
      driverStatus: driver.status || 'AVAILABLE',
      hireDate: driver.hireDate ? new Date(driver.hireDate).toISOString().split('T')[0] : '',
      thresholdAmount: driver.thresholdAmount || '',
      localDriver: driver.localDriver || false,
      // Compliance
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
      // Address
      address1: driver.address1 || '',
      country: driver.country || 'United States',
      city: driver.city || '',
      stateProvince: driver.state || '',
      zipCode: driver.zipCode || '',
      address2: driver.address2 || '',
      // Dispatch preferences
      dispatchPreferences: driver.dispatchPreferences || '',
      // Assignments
      assignedTruck: driver.currentTruckId || '',
      assignedTrailer: driver.currentTrailerId || '',
      assignedDispatcher: driver.assignedDispatcherId || '',
      hrManager: driver.hrManagerId || '',
      notes: driver.notes || '',
      teamDriver: driver.teamDriver || false,
      otherId: driver.otherId || '',
      mcNumber: typeof driver.mcNumber === 'object' ? driver.mcNumber?.id || '' : driver.mcNumber || '',
      safetyManager: driver.safetyManagerId || '',
      driverTags: driver.tags || [],
      // Emergency contact
      contactName: driver.emergencyContactName || '',
      relationshipToDriver: driver.emergencyContactRelation || '',
      contactAddress1: driver.emergencyContactAddress1 || '',
      contactCountry: driver.emergencyContactCountry || 'United States',
      contactCity: driver.emergencyContactCity || '',
      contactState: driver.emergencyContactState || '',
      contactPhoneNumber: driver.emergencyContactPhone || '',
      contactEmailAddress: driver.emergencyContactEmail || '',
      contactAddress2: driver.emergencyContactAddress2 || '',
      contactZipCode: driver.emergencyContactZip || '',
    },
  });

  const [endorsements, setEndorsements] = useState<string[]>(watch('endorsements') || []);
  const [driverTags, setDriverTags] = useState<string[]>(watch('driverTags') || []);

  const endorsementOptions = [
    'N - Tank Vehicles',
    'T - Doubles/Triples',
    'H - Hazardous Materials',
    'X - Tank + Hazmat',
    'P - Passenger',
    'S - School Bus',
  ];

  const onSubmit = (data: any) => {
    // Map form field names to API field names
    const apiData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.contactNumber,
      socialSecurityNumber: data.socialSecurityNumber,
      employeeStatus: data.employmentStatus,
      birthDate: data.birthDate || undefined,
      tenure: data.tenureAtCompany,
      gender: data.gender || undefined,
      maritalStatus: data.maritalStatus || undefined,
      localDriver: data.localDriver,
      telegramNumber: data.telegramNumber,
      thresholdAmount: data.thresholdAmount ? parseFloat(data.thresholdAmount) : undefined,
      status: data.driverStatus,
      hireDate: data.hireDate || undefined,
      // Compliance
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
      // Address
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.stateProvince,
      zipCode: data.zipCode,
      country: data.country,
      // Dispatch
      dispatchPreferences: data.dispatchPreferences,
      // Assignments
      currentTruckId: data.assignedTruck && data.assignedTruck !== 'none' ? data.assignedTruck : undefined,
      currentTrailerId: data.assignedTrailer && data.assignedTrailer !== 'none' ? data.assignedTrailer : undefined,
      assignedDispatcherId: data.assignedDispatcher && data.assignedDispatcher !== 'none' ? data.assignedDispatcher : undefined,
      hrManagerId: data.hrManager && data.hrManager !== 'none' ? data.hrManager : undefined,
      safetyManagerId: data.safetyManager && data.safetyManager !== 'none' ? data.safetyManager : undefined,
      mcNumber: data.mcNumber,
      teamDriver: data.teamDriver,
      otherId: data.otherId,
      driverTags: driverTags,
      notes: data.notes,
      // Emergency contact
      emergencyContactName: data.contactName,
      emergencyContactRelation: data.relationshipToDriver,
      emergencyContactAddress1: data.contactAddress1,
      emergencyContactAddress2: data.contactAddress2,
      emergencyContactCity: data.contactCity,
      emergencyContactState: data.contactState,
      emergencyContactZip: data.contactZipCode,
      emergencyContactCountry: data.contactCountry,
      emergencyContactPhone: data.contactPhoneNumber,
      emergencyContactEmail: data.contactEmailAddress,
    };

    onSave(apiData);
  };

  return (
    <form id="driver-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="localDriver"
                    checked={watch('localDriver')}
                    onCheckedChange={(checked) => setValue('localDriver', checked as boolean)}
                  />
                  <Label htmlFor="localDriver">Local driver</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register('firstName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register('lastName')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input id="contactNumber" {...register('contactNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialSecurityNumber">Social Security Number</Label>
                <Input id="socialSecurityNumber" {...register('socialSecurityNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select
                  value={watch('employmentStatus')}
                  onValueChange={(value) => setValue('employmentStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                    <SelectItem value="APPLICANT">Applicant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input id="emailAddress" type="email" {...register('emailAddress')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenureAtCompany">Tenure at Company</Label>
                <Input id="tenureAtCompany" {...register('tenureAtCompany')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramNumber">Telegram Number</Label>
                <Input id="telegramNumber" {...register('telegramNumber')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={watch('gender')}
                    onValueChange={(value) => setValue('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select
                    value={watch('maritalStatus')}
                    onValueChange={(value) => setValue('maritalStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="MARRIED">Married</SelectItem>
                      <SelectItem value="DIVORCED">Divorced</SelectItem>
                      <SelectItem value="WIDOWED">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverStatus">Driver Status</Label>
                <Select
                  value={watch('driverStatus')}
                  onValueChange={(value) => setValue('driverStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="IN_TRANSIT">In-Transit</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="ON_DUTY">On Duty</SelectItem>
                    <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input id="hireDate" type="date" {...register('hireDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thresholdAmount">Threshold Amount</Label>
                <Input id="thresholdAmount" type="number" {...register('thresholdAmount')} />
              </div>
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driverLicenseId">Driver License ID</Label>
                <Input id="driverLicenseId" {...register('driverLicenseId')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverLicenseExpiration">Driver License Expiration</Label>
                <Input id="driverLicenseExpiration" type="date" {...register('driverLicenseExpiration')} />
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
                    {/* Add more states */}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCdlExperience">Total CDL Experience</Label>
                <Input id="totalCdlExperience" {...register('totalCdlExperience')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictions">Restrictions</Label>
                <Input id="restrictions" {...register('restrictions')} />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="medCardLicenseExpiration">Med Card License Expiration</Label>
                <Input id="medCardLicenseExpiration" type="date" {...register('medCardLicenseExpiration')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverLicenseIssueDate">Driver License Issue Date</Label>
                <Input id="driverLicenseIssueDate" type="date" {...register('driverLicenseIssueDate')} />
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
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address1">Address 1</Label>
                <Input id="address1" {...register('address1')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={watch('country')}
                  onValueChange={(value) => setValue('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stateProvince">State/Province</Label>
                <Select
                  value={watch('stateProvince')}
                  onValueChange={(value) => setValue('stateProvince', value)}
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

              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input id="zipCode" {...register('zipCode')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address 2</Label>
                <Input id="address2" {...register('address2')} />
              </div>
            </CardContent>
          </Card>

          {/* Dispatch Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Dispatch preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="dispatchPreferences">Dispatch preferences</Label>
                <Textarea id="dispatchPreferences" {...register('dispatchPreferences')} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTruck">Assigned Truck</Label>
                <Select
                  value={watch('assignedTruck') || 'none'}
                  onValueChange={(value) => setValue('assignedTruck', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.truckNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTrailer">Assigned Trailer</Label>
                <Select
                  value={watch('assignedTrailer') || 'none'}
                  onValueChange={(value) => setValue('assignedTrailer', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trailer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {trailers.map((trailer) => (
                      <SelectItem key={trailer.id} value={trailer.id}>
                        {trailer.trailerNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedDispatcher">Assigned Dispatcher</Label>
                <Select
                  value={watch('assignedDispatcher') || 'none'}
                  onValueChange={(value) => setValue('assignedDispatcher', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispatcher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dispatchers.map((dispatcher) => (
                      <SelectItem key={dispatcher.id} value={dispatcher.id}>
                        {dispatcher.firstName} {dispatcher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hrManager">HR Manager</Label>
                <Select
                  value={watch('hrManager') || 'none'}
                  onValueChange={(value) => setValue('hrManager', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select HR manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register('notes')} />
              </div>

              <div className="flex items-center space-x-4">
                <Label>Team Driver</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="teamDriverYes"
                      name="teamDriver"
                      checked={watch('teamDriver') === true}
                      onChange={() => setValue('teamDriver', true)}
                    />
                    <Label htmlFor="teamDriverYes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="teamDriverNo"
                      name="teamDriver"
                      checked={watch('teamDriver') === false}
                      onChange={() => setValue('teamDriver', false)}
                    />
                    <Label htmlFor="teamDriverNo">No</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherId">Other ID</Label>
                <Input id="otherId" {...register('otherId')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcNumber">MC Number</Label>
                <Select
                  value={watch('mcNumber')}
                  onValueChange={(value) => setValue('mcNumber', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOUR WAYS LOGISTICS II INC">FOUR WAYS LOGISTICS II INC</SelectItem>
                    <SelectItem value="FOUR WAYS LOGISTICS III">FOUR WAYS LOGISTICS III</SelectItem>
                    <SelectItem value="Truckzilla Inc">Truckzilla Inc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="safetyManager">Safety Manager</Label>
                <Select
                  value={watch('safetyManager') || 'none'}
                  onValueChange={(value) => setValue('safetyManager', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select safety manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Driver tags</Label>
                <div className="flex flex-wrap gap-2">
                  {driverTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setDriverTags(driverTags.filter((t) => t !== tag))}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    placeholder="Add tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        if (value && !driverTags.includes(value)) {
                          setDriverTags([...driverTags, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="w-[150px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverCommentsSection driver={driver} />
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" {...register('contactName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationshipToDriver">Relationship to the Driver</Label>
                <Input id="relationshipToDriver" {...register('relationshipToDriver')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactAddress1">Contact's Address 1</Label>
                <Input id="contactAddress1" {...register('contactAddress1')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactCountry">Country</Label>
                <Select
                  value={watch('contactCountry')}
                  onValueChange={(value) => setValue('contactCountry', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactCity">City</Label>
                <Input id="contactCity" {...register('contactCity')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactState">State</Label>
                <Input id="contactState" {...register('contactState')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhoneNumber">Contact's Phone Number</Label>
                <Input id="contactPhoneNumber" {...register('contactPhoneNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmailAddress">Contact's Email Address</Label>
                <Input id="contactEmailAddress" type="email" {...register('contactEmailAddress')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactAddress2">Contact's Address 2</Label>
                <Input id="contactAddress2" {...register('contactAddress2')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactZipCode">Zip Code</Label>
                <Input id="contactZipCode" {...register('contactZipCode')} />
              </div>
            </CardContent>
          </Card>

          {/* Truck History */}
          <Card>
            <CardHeader>
              <CardTitle>Truck history</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverTruckHistoryTable driver={driver} trucks={trucks} />
            </CardContent>
          </Card>

          {/* Trailer History */}
          <Card>
            <CardHeader>
              <CardTitle>Trailer history</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverTrailerHistoryTable driver={driver} trailers={trailers} />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

