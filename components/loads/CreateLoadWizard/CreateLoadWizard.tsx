'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLoadSchema, type CreateLoadInput } from '@/lib/validations/load';
import { z } from 'zod';
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
    const errorMessage = error.error?.message || error.message || 'Failed to create load';
    
    // If load already exists, suggest generating a new load number
    if (error.error?.code === 'CONFLICT' && errorMessage.includes('already exists')) {
      throw new Error('Load number already exists. Please use a different load number or leave it blank to auto-generate one.');
    }
    
    // Include validation details if available
    if (error.error?.details && Array.isArray(error.error.details)) {
      const details = error.error.details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ');
      throw new Error(`${errorMessage}. ${details}`);
    }
    throw new Error(errorMessage);
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
      
      // Immediately verify the load exists by fetching it
      try {
        const verifyResponse = await fetch(apiUrl(`/api/loads?page=1&limit=1&search=${encodeURIComponent(data.data.loadNumber || newLoadId)}`));
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('[CreateLoadWizard] Load verification - API returned:', {
            total: verifyData.meta?.total || 0,
            found: verifyData.data?.length || 0,
            loadNumber: data.data.loadNumber,
          });
        }
      } catch (error) {
        console.error('[CreateLoadWizard] Error verifying load:', error);
      }
      
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
      
      console.log('[CreateLoadWizard] Load created successfully!', { newLoadId, data });
      console.log('[CreateLoadWizard] Created load details:', {
        id: newLoadId,
        loadNumber: data.data?.loadNumber,
        mcNumberId: data.data?.mcNumberId,
        mcNumber: data.data?.mcNumber,
        status: data.data?.status,
        companyId: data.data?.companyId,
      });
      
      // AGGRESSIVE cache clearing - remove ALL loads queries from cache
      queryClient.removeQueries({ 
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return firstKey === 'loads' || (typeof firstKey === 'string' && firstKey.startsWith('load'));
        }
      });
      
      // Invalidate all loads queries
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return firstKey === 'loads' || (typeof firstKey === 'string' && firstKey.startsWith('load'));
        }
      });
      
      console.log('[CreateLoadWizard] Created load details:', {
        id: newLoadId,
        loadNumber: data.data?.loadNumber,
        mcNumberId: data.data?.mcNumberId,
        mcNumber: data.data?.mcNumber,
        status: data.data?.status,
        companyId: data.data?.companyId,
      });
      
      // IMPORTANT: Check if MC number matches current view
      const createdMcNumberId = data.data?.mcNumberId;
      if (createdMcNumberId) {
        console.warn('[CreateLoadWizard] ⚠️ Load created with MC Number ID:', createdMcNumberId);
        console.warn('[CreateLoadWizard] ⚠️ Make sure your MC view mode is set to "All MCs" or includes this MC number');
      } else {
        console.warn('[CreateLoadWizard] ⚠️ Load created WITHOUT an MC Number (mcNumberId is null)');
        console.warn('[CreateLoadWizard] ⚠️ This load may not appear if you have MC filtering enabled');
      }
      
      // Show success message with MC number info
      const loadNumber = data.data?.loadNumber || newLoadId;
      const mcWarning = createdMcNumberId 
        ? `MC Number: ${createdMcNumberId}. Switch to "All MCs" view to see this load.`
        : 'No MC Number assigned. Switch to "All MCs" view to see this load.';
      
      toast.success(`Load ${loadNumber} created successfully!`, {
        description: mcWarning,
        duration: 6000,
      });
      
      // Force a hard page refresh to ensure the list updates
      // This is the most reliable way to ensure the load appears
      setTimeout(() => {
        window.location.href = '/dashboard/loads';
      }, 500);
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
    try {
      // Ensure all data from state is included
      const submissionData: CreateLoadInput = {
        ...loadData,
        ...data,
      } as CreateLoadInput;

      console.log('[CreateLoadWizard] onSubmit called', { 
        loadData, 
        formData: data, 
        submissionData 
      });

      // Validate customer
      if (!submissionData.customerId || (typeof submissionData.customerId === 'string' && submissionData.customerId.trim() === '')) {
        toast.error('Customer is required');
        setValidationErrors({ customerId: 'Customer is required' });
        return;
      }

      // Auto-generate load number if not provided
      if (!submissionData.loadNumber || (typeof submissionData.loadNumber === 'string' && submissionData.loadNumber.trim() === '')) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        submissionData.loadNumber = `LOAD-${timestamp}-${random}`;
        console.log('[CreateLoadWizard] Auto-generated load number:', submissionData.loadNumber);
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

      // Clean up the data - remove undefined values and convert empty strings to undefined for optional fields
      const cleanedData: any = { ...submissionData };
      Object.keys(cleanedData).forEach((key) => {
        const value = cleanedData[key];
        if (value === '' || value === null) {
          // Only remove empty strings/null for optional fields
          // Required fields like customerId, loadNumber should keep their values
          if (key !== 'customerId' && key !== 'loadNumber' && key !== 'loadType' && key !== 'equipmentType') {
            delete cleanedData[key];
          }
        }
      });

      // Validate using Zod schema
      console.log('[CreateLoadWizard] Validating cleaned data:', cleanedData);
      const validated = createLoadSchema.parse(cleanedData);
      console.log('[CreateLoadWizard] Validation passed:', validated);
      createMutation.mutate(validated);
    } catch (error) {
      console.error('[CreateLoadWizard] Validation error:', error);
      
      if (error instanceof z.ZodError) {
        // Convert Zod errors to validation errors
        const errors: Record<string, string> = {};
        const errorMessages: string[] = [];
        
        error.issues.forEach((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
          const fieldName = issue.path.length > 0 ? issue.path[issue.path.length - 1] : 'form';
          errors[path] = issue.message;
          errorMessages.push(`${fieldName}: ${issue.message}`);
        });
        
        console.error('[CreateLoadWizard] Validation errors:', {
          errors,
          errorMessages,
          issues: error.issues,
          formatted: error.format(),
        });
        
        setValidationErrors(errors);
        
        // Show a more helpful error message
        if (errorMessages.length > 0) {
          const firstError = errorMessages[0];
          const remainingCount = errorMessages.length - 1;
          const message = remainingCount > 0 
            ? `${firstError} (and ${remainingCount} more error${remainingCount > 1 ? 's' : ''})`
            : firstError;
          toast.error(`Validation failed: ${message}`);
        } else {
          toast.error('Please fix validation errors before submitting');
        }
      } else {
        console.error('[CreateLoadWizard] Non-Zod error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while submitting the form';
        toast.error(errorMessage);
      }
    }
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
          <form 
            id="create-load-form" 
            onSubmit={(e) => {
              e.preventDefault();
              // Pass loadData directly since inputs use controlled state, not react-hook-form
              onSubmit(loadData as CreateLoadInput);
            }}
          >
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
              form="create-load-form"
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

