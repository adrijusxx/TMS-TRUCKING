'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import { KeyRound, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface DriverPersonalInfoTabProps {
  driver: any;
  onSave: (data: any) => void;
}

export default function DriverPersonalInfoTab({
  driver,
  onSave,
}: DriverPersonalInfoTabProps) {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    driver.user?.tempPassword || null
  );
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const newPassword = generatePassword();
      const response = await fetch(apiUrl(`/api/drivers/${driver.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, tempPassword: newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reset password');
      }
      return newPassword;
    },
    onSuccess: (newPassword) => {
      setGeneratedPassword(newPassword);
      toast.success('Password reset successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      firstName: driver.user.firstName || '',
      lastName: driver.user.lastName || '',
      contactNumber: driver.user.phone || '',
      socialSecurityNumber: driver.socialSecurityNumber || '',
      emailAddress: driver.user.email || '',
      birthDate: driver.birthDate ? new Date(driver.birthDate).toISOString().split('T')[0] : '',
      telegramNumber: driver.telegramNumber || '',
      gender: driver.gender || '',
      maritalStatus: driver.maritalStatus || '',
      localDriver: driver.localDriver || false,
      // Address
      address1: driver.address1 || '',
      country: driver.country || 'United States',
      city: driver.city || '',
      stateProvince: driver.state || '',
      zipCode: driver.zipCode || '',
      address2: driver.address2 || '',
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

  const onSubmit = (data: any) => {
    const apiData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.contactNumber,
      socialSecurityNumber: data.socialSecurityNumber,
      birthDate: data.birthDate || undefined,
      gender: data.gender || undefined,
      maritalStatus: data.maritalStatus || undefined,
      localDriver: data.localDriver,
      telegramNumber: data.telegramNumber,
      // Address
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.stateProvince,
      zipCode: data.zipCode,
      country: data.country,
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

  // Save when main Save button is clicked
  useEffect(() => {
    const handleSave = () => {
      handleSubmit(onSubmit)();
    };
    
    window.addEventListener('driver-form-save', handleSave);
    return () => window.removeEventListener('driver-form-save', handleSave);
  }, [handleSubmit]);

  return (
    <form id="driver-personal-info-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
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
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input id="emailAddress" type="email" {...register('emailAddress')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialSecurityNumber">Social Security Number</Label>
                <Input id="socialSecurityNumber" {...register('socialSecurityNumber')} />
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
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address1">Address 1</Label>
                <Input id="address1" {...register('address1')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address 2</Label>
                <Input id="address2" {...register('address2')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" {...register('contactName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationshipToDriver">Relationship to Driver</Label>
                <Input id="relationshipToDriver" {...register('relationshipToDriver')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhoneNumber">Phone Number</Label>
                <Input id="contactPhoneNumber" {...register('contactPhoneNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmailAddress">Email Address</Label>
                <Input id="contactEmailAddress" type="email" {...register('contactEmailAddress')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactAddress1">Address 1</Label>
                <Input id="contactAddress1" {...register('contactAddress1')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactAddress2">Address 2</Label>
                <Input id="contactAddress2" {...register('contactAddress2')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactCity">City</Label>
                <Input id="contactCity" {...register('contactCity')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactState">State</Label>
                  <Input id="contactState" {...register('contactState')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactZipCode">Zip Code</Label>
                  <Input id="contactZipCode" {...register('contactZipCode')} />
                </div>
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
            </CardContent>
          </Card>

          {/* Password Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Password Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedPassword && (
                <div className="space-y-2">
                  <Label>Current Temporary Password</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={generatedPassword}
                        readOnly
                        type={showPassword ? 'text' : 'password'}
                        className="pr-10 font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPassword}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This password will be cleared after the driver&apos;s first login.
                  </p>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => resetPasswordMutation.mutate()}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Resetting...</>
                ) : (
                  <><KeyRound className="h-4 w-4 mr-2" />Reset Password</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

