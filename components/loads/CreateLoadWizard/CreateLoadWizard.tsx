'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLoadSchema, type CreateLoadInput } from '@/lib/validations/load';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Step1IntelligentIngestion from './Step1IntelligentIngestion';
import Step2ResourceAssignment from './Step2ResourceAssignment';
import Step3ReviewFinalization from './Step3ReviewFinalization';
import { apiUrl } from '@/lib/utils';

async function createLoad(data: CreateLoadInput) {
  const response = await fetch(apiUrl('/api/loads'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create load');
  }
  return response.json();
}

const STEPS = [
  { label: 'Intelligent Ingestion', description: 'Upload Rate Confirmation' },
  { label: 'Resource Assignment', description: 'Assign Driver & Equipment' },
  { label: 'Review & Finalize', description: 'Review and Create Load' },
];

export default function CreateLoadWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadData, setLoadData] = useState<Partial<CreateLoadInput>>({});
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    trigger,
  } = useForm<CreateLoadInput>({
    resolver: zodResolver(createLoadSchema) as any,
    defaultValues: loadData as CreateLoadInput,
  });

  const createMutation = useMutation({
    mutationFn: createLoad,
    onSuccess: async (data) => {
      const newLoadId = data.data.id;
      
      // Upload pending files
      if (pendingFiles.length > 0) {
        try {
          await Promise.all(
            pendingFiles.map(async (file) => {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('loadId', newLoadId);
              formData.append('type', 'RATE_CONFIRMATION');
              formData.append('fileName', file.name);
              formData.append('title', file.name);
              formData.append('fileUrl', `/uploads/${Date.now()}-${file.name}`);
              formData.append('fileSize', file.size.toString());
              formData.append('mimeType', file.type);
              
              const response = await fetch(apiUrl('/api/documents/upload'), {
                method: 'POST',
                body: formData,
              });
              
              if (!response.ok) {
                throw new Error(`Failed to upload ${file.name}`);
              }
            })
          );
          toast.success(`Load created and ${pendingFiles.length} file(s) attached successfully`);
        } catch (error) {
          console.error('Error uploading files:', error);
          toast.error('Load created but some files failed to upload');
        }
      } else {
        toast.success('Load created successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      router.push(`/dashboard/loads/${newLoadId}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create load');
    },
  });

  const handleDataExtracted = useCallback((data: Partial<CreateLoadInput>, pdfFile?: File) => {
    setLoadData((prev) => ({ ...prev, ...data }));
    if (pdfFile) {
      setPendingFiles((prev) => [...prev, pdfFile]);
    }
    // Move to next step
    setCurrentStep(2);
  }, []);

  const handleSkipToManual = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleFieldChange = useCallback((field: keyof CreateLoadInput, value: any) => {
    setLoadData((prev) => ({ ...prev, [field]: value }));
    setValue(field, value);
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [setValue, validationErrors]);

  const validateCurrentStep = async (): Promise<boolean> => {
    if (currentStep === 1) {
      // Step 1 validation is handled by the component itself
      return true;
    }
    
    if (currentStep === 2) {
      // Step 2: Driver is optional but recommended
      return true;
    }
    
    if (currentStep === 3) {
      // Step 3: Validate all required fields
      const result = await trigger();
      if (!result) {
        // Convert form errors to validation errors
        const errors: Record<string, string> = {};
        Object.keys(formErrors).forEach((key) => {
          const error = formErrors[key as keyof typeof formErrors];
          if (error?.message) {
            errors[key] = error.message;
          }
        });
        setValidationErrors(errors);
        toast.error('Please fix validation errors before proceeding');
      }
      return result;
    }
    
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: CreateLoadInput) => {
    // Ensure all data from state is included
    const submissionData: CreateLoadInput = {
      ...loadData,
      ...data,
    } as CreateLoadInput;

    // Validate customer
    if (!submissionData.customerId || submissionData.customerId.trim() === '') {
      toast.error('Customer is required');
      setValidationErrors({ customerId: 'Customer is required' });
      return;
    }

    // Ensure required fields have defaults
    if (!submissionData.loadType) {
      submissionData.loadType = 'FTL';
    }
    if (!submissionData.equipmentType) {
      submissionData.equipmentType = 'DRY_VAN';
    }
    if (submissionData.revenue === undefined || submissionData.revenue === null) {
      submissionData.revenue = 0;
    }

    createMutation.mutate(submissionData);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Load</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Use AI to extract data from Rate Confirmations or enter manually
          </p>
        </div>
        <Link href="/dashboard/loads">
          <Button type="button" variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stepper */}
      <Card className="p-6">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1IntelligentIngestion
            onDataExtracted={handleDataExtracted}
            onSkipToManual={handleSkipToManual}
          />
        )}
        {currentStep === 2 && (
          <Step2ResourceAssignment
            driverId={loadData.driverId}
            truckId={loadData.truckId}
            trailerNumber={loadData.trailerNumber}
            onDriverChange={(id) => handleFieldChange('driverId', id)}
            onTruckChange={(id) => handleFieldChange('truckId', id)}
            onTrailerChange={(number) => handleFieldChange('trailerNumber', number)}
          />
        )}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Step3ReviewFinalization
              loadData={loadData}
              onFieldChange={handleFieldChange}
              errors={validationErrors}
            />
          </form>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Load'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

