'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

interface PersonalInfoTabProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  copied: boolean;
  onRegeneratePassword: () => void;
  onCopyPassword: () => void;
}

export function PersonalInfoTab({
  register, setValue, watch, errors,
  showPassword, setShowPassword, copied,
  onRegeneratePassword, onCopyPassword,
}: PersonalInfoTabProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" placeholder="John" {...register('firstName')} />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" placeholder="Doe" {...register('lastName')} />
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message as string}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4 pt-6">
                <Checkbox
                  id="localDriver"
                  checked={watch('localDriver') || false}
                  onCheckedChange={(checked) => setValue('localDriver', checked as boolean)}
                />
                <Label htmlFor="localDriver" className="text-sm">Local</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="555-0100" {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="driver@example.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverNumber">Driver Number *</Label>
              <Input id="driverNumber" placeholder="D-001" {...register('driverNumber')} />
              {errors.driverNumber && <p className="text-sm text-destructive">{errors.driverNumber.message as string}</p>}
            </div>

            <McNumberSelector
              value={watch('mcNumberId')}
              onValueChange={(mcNumberId) => setValue('mcNumberId', mcNumberId, { shouldValidate: true })}
              required
              error={errors.mcNumberId?.message as string}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="socialSecurityNumber">SSN</Label>
                <Input id="socialSecurityNumber" {...register('socialSecurityNumber')} placeholder="XXX-XX-XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={watch('gender') || ''} onValueChange={(v) => setValue('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select value={watch('maritalStatus') || ''} onValueChange={(v) => setValue('maritalStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
              <Label htmlFor="telegramNumber">Telegram Number</Label>
              <Input id="telegramNumber" {...register('telegramNumber')} />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10 font-mono"
                    {...register('password')}
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={onRegeneratePassword} title="Generate"><RefreshCw className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" onClick={onCopyPassword} title="Copy">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
              <p className="text-xs text-muted-foreground">Auto-generated. Copy and share with the driver.</p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address1">Address 1</Label>
              <Input id="address1" {...register('address1')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2">Address 2</Label>
              <Input id="address2" {...register('address2')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" maxLength={2} placeholder="TX" {...register('state')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input id="zipCode" {...register('zipCode')} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Emergency Contact */}
      <Card>
        <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input id="emergencyContactName" {...register('emergencyContactName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelation">Relationship</Label>
            <Input id="emergencyContactRelation" {...register('emergencyContactRelation')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input id="emergencyContactPhone" type="tel" {...register('emergencyContactPhone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactEmail">Email</Label>
            <Input id="emergencyContactEmail" type="email" {...register('emergencyContactEmail')} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
