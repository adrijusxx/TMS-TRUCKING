'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createDriverSchema, type CreateDriverInput } from '@/lib/validations/driver';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Shield, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';
import { PersonalInfoTab } from './CreateDriverTabs/PersonalInfoTab';
import { ComplianceTab } from './CreateDriverTabs/ComplianceTab';
import { PayrollTab } from './CreateDriverTabs/PayrollTab';

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createDriver(data: CreateDriverInput) {
  const response = await fetch(apiUrl('/api/drivers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create driver');
  }
  return response.json();
}

interface CreateDriverFormProps {
  onSuccess?: (driverId: string) => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function CreateDriverForm({
  onSuccess,
  onCancel,
  isSheet = false,
}: CreateDriverFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const defaultPassword = useState(() => generatePassword())[0];

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
    setValue, watch,
  } = useForm<CreateDriverInput>({
    resolver: zodResolver(createDriverSchema),
    defaultValues: {
      payType: 'PER_MILE',
      password: defaultPassword,
      driverFacingCamera: 'No',
      driverType: 'COMPANY_DRIVER',
      country: 'United States',
    },
  });

  const currentPassword = watch('password');

  const handleRegeneratePassword = () => {
    setValue('password', generatePassword());
  };

  const handleCopyPassword = () => {
    if (currentPassword) {
      navigator.clipboard.writeText(currentPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver created successfully');
      if (onSuccess) {
        onSuccess(data.data.id);
      } else {
        router.push(`/dashboard/drivers/${data.data.driverNumber || data.data.id}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message || 'Failed to create driver');
    },
  });

  const onSubmit = (data: CreateDriverInput) => {
    setError(null);
    createMutation.mutate(data);
  };

  const handleFormSubmit = () => {
    handleSubmit(
      onSubmit,
      (formErrors) => {
        // Navigate to the tab containing the first error
        const errorFields = Object.keys(formErrors);
        const personalFields = ['firstName', 'lastName', 'email', 'password', 'driverNumber', 'mcNumberId', 'phone'];
        const complianceFields = ['licenseNumber', 'licenseState', 'licenseExpiry', 'medicalCardExpiry'];
        const payrollFields = ['payType', 'payRate'];

        if (errorFields.some((f) => personalFields.includes(f))) {
          setActiveTab('personal');
        } else if (errorFields.some((f) => complianceFields.includes(f))) {
          setActiveTab('compliance');
        } else if (errorFields.some((f) => payrollFields.includes(f))) {
          setActiveTab('payroll');
        }
        toast.error('Please fix the required fields');
      }
    )();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onCancel ? (
            <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/dashboard/drivers">
              <Button type="button" variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div>
            <h2 className="text-2xl font-semibold">Create Driver</h2>
            <p className="text-sm text-muted-foreground">Fill out the tabs below to create a new driver account</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          ) : (
            <Link href="/dashboard/drivers">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          )}
          <Button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSubmitting || createMutation.isPending}
          >
            {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Driver'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex bg-muted/50 p-1 h-auto">
          <TabsTrigger value="personal" className="flex-1 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="h-4 w-4" /> Personal
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex-1 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex-1 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="h-4 w-4" /> Payroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <PersonalInfoTab
            register={register} setValue={setValue} watch={watch} errors={errors}
            showPassword={showPassword} setShowPassword={setShowPassword}
            copied={copied}
            onRegeneratePassword={handleRegeneratePassword}
            onCopyPassword={handleCopyPassword}
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <ComplianceTab register={register} setValue={setValue} watch={watch} errors={errors} />
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <PayrollTab register={register} setValue={setValue} watch={watch} errors={errors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
