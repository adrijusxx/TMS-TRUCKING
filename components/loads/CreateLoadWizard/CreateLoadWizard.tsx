'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createLoadSchema, type CreateLoadInput } from '@/lib/validations/load';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Loader2, Save, FileStack, User, Truck, Package } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Step1IntelligentIngestion from './Step1IntelligentIngestion';
import Step3ReviewFinalization from './Step3ReviewFinalization';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import { apiUrl } from '@/lib/utils';
import {
  saveDraft,
  getDraft,
  deleteDraft,
  getDraftsList,
  type LoadDraftListItem,
} from '@/lib/managers/LoadDraftManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { showErrorFeedback } from '@/components/ui/error-feedback-toast';

interface CreateLoadError extends Error {
  code?: string;
  details?: string;
}

async function createLoad(data: CreateLoadInput) {
  const response = await fetch(apiUrl('/api/loads'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    const errorMessage = error.error?.message || error.message || 'Failed to create load';
    const errorCode = error.error?.code;

    let details = '';
    if (error.error?.details) {
      if (typeof error.error.details === 'string') {
        details = error.error.details;
      } else if (Array.isArray(error.error.details)) {
        details = error.error.details
          .map((d: { path?: string[]; message?: string }) => `${d.path?.join('.') || 'field'}: ${d.message}`)
          .join('\n');
      }
    }

    showErrorFeedback('Load Creation Failed', errorMessage, {
      errorCode,
      details: details || `Load Number: ${data.loadNumber}\nCustomer ID: ${data.customerId}\nTimestamp: ${error.error?.timestamp || new Date().toISOString()}`,
    });

    const err = new Error(errorMessage) as CreateLoadError;
    err.code = errorCode;
    err.details = details;
    throw err;
  }
  return response.json();
}

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000&status=AVAILABLE'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

async function fetchTrailers() {
  const response = await fetch(apiUrl('/api/trailers?limit=1000&skipStats=true'));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  return response.json();
}

interface Driver {
  id: string;
  driverNumber: string;
  currentTruck?: { id: string; truckNumber: string } | null;
  currentTrailer?: { id: string; trailerNumber: string } | null;
  user: { firstName: string; lastName: string };
}

// Reduced to 2 steps - Resource Assignment merged into Review
const STEPS = [
  { label: 'Import', description: 'Upload Rate Con' },
  { label: 'Review & Create', description: 'Assign & Submit' },
];

interface CreateLoadWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function CreateLoadWizard({ onSuccess, onCancel, isSheet = false }: CreateLoadWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadData, setLoadData] = useState<Partial<CreateLoadInput>>({});
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<LoadDraftListItem[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastDriverId, setLastDriverId] = useState<string | undefined>(undefined);

  // Fetch resources for assignment
  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'wizard'],
    queryFn: fetchDrivers,
  });
  const { data: trucksData } = useQuery({
    queryKey: ['trucks', 'wizard'],
    queryFn: fetchTrucks,
  });
  const { data: trailersData } = useQuery({
    queryKey: ['trailers', 'wizard'],
    queryFn: fetchTrailers,
  });

  const drivers: Driver[] = driversData?.data || [];
  const trucks = trucksData?.data || [];
  const trailers = trailersData?.data || [];
  const selectedDriver = drivers.find((d) => d.id === loadData.driverId);

  // Auto-fill truck/trailer when driver is selected
  useEffect(() => {
    if (selectedDriver && loadData.driverId !== lastDriverId) {
      if (selectedDriver.currentTruck?.id && !loadData.truckId) {
        setLoadData((prev) => ({ ...prev, truckId: selectedDriver.currentTruck!.id }));
      }
      if (selectedDriver.currentTrailer?.trailerNumber && !loadData.trailerNumber) {
        setLoadData((prev) => ({ ...prev, trailerNumber: selectedDriver.currentTrailer!.trailerNumber }));
      }
      setLastDriverId(loadData.driverId);
    }
  }, [selectedDriver, loadData.driverId, lastDriverId, loadData.truckId, loadData.trailerNumber]);

  // Load draft from URL
  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (draftId) {
      const draft = getDraft(draftId);
      if (draft) {
        setLoadData(draft.data);
        setCurrentStep(Math.min(draft.step, 2)); // Map old step 3 to 2
        setCurrentDraftId(draftId);
        toast.success('Draft loaded');
      }
    }
    setSavedDrafts(getDraftsList());
  }, [searchParams]);

  // Auto-save draft
  useEffect(() => {
    if (Object.keys(loadData).length === 0) return;
    const autoSaveInterval = setInterval(() => {
      try {
        const id = saveDraft(
          loadData,
          currentStep,
          currentDraftId || undefined,
          loadData.loadNumber || `Draft - ${new Date().toLocaleDateString()}`,
          pendingFiles.map((f) => f.name)
        );
        setCurrentDraftId(id);
        setSavedDrafts(getDraftsList());
      } catch (error) { }
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [loadData, currentStep, currentDraftId, pendingFiles]);

  const handleSaveDraft = useCallback(() => {
    setIsSavingDraft(true);
    try {
      const id = saveDraft(
        loadData,
        currentStep,
        currentDraftId || undefined,
        loadData.loadNumber || `Draft - ${new Date().toLocaleDateString()}`,
        pendingFiles.map((f) => f.name)
      );
      setCurrentDraftId(id);
      setSavedDrafts(getDraftsList());
      toast.success('Draft saved');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  }, [loadData, currentStep, currentDraftId, pendingFiles]);

  const handleLoadDraft = useCallback((draftId: string) => {
    const draft = getDraft(draftId);
    if (draft) {
      setLoadData(draft.data);
      setCurrentStep(Math.min(draft.step, 2));
      setCurrentDraftId(draftId);
      toast.success('Draft loaded');
    }
  }, []);

  const handleDeleteDraft = useCallback((draftId: string) => {
    deleteDraft(draftId);
    setSavedDrafts(getDraftsList());
    if (draftId === currentDraftId) setCurrentDraftId(null);
    toast.success('Draft deleted');
  }, [currentDraftId]);

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
              if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
            })
          );
          toast.success(`Load created with ${pendingFiles.length} file(s)`);
        } catch (error) {
          toast.error('Load created but some files failed');
        }
      } else {
        toast.success('Load created successfully');
      }

      queryClient.removeQueries({
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return firstKey === 'loads' || (typeof firstKey === 'string' && firstKey.startsWith('load'));
        }
      });

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return firstKey === 'loads' || (typeof firstKey === 'string' && firstKey.startsWith('load'));
        }
      });

      if (currentDraftId) deleteDraft(currentDraftId);

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          window.location.href = '/dashboard/loads';
        }, 500);
      }
    },
    onError: () => { },
  });

  const handleDataExtracted = useCallback((data: Partial<CreateLoadInput>, pdfFile?: File) => {
    setLoadData((prev) => ({ ...prev, ...data }));
    if (pdfFile) setPendingFiles((prev) => [...prev, pdfFile]);
    setCurrentStep(2);
  }, []);

  const handleSkipToManual = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleFieldChange = useCallback((field: keyof CreateLoadInput, value: any) => {
    setLoadData((prev) => ({ ...prev, [field]: value }));
    setValue(field, value);
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [setValue, validationErrors]);

  const handleNext = async () => {
    if (currentStep < STEPS.length) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreateLoadInput) => {
    try {
      const submissionData: CreateLoadInput = { ...loadData, ...data } as CreateLoadInput;

      if (!submissionData.customerId || (typeof submissionData.customerId === 'string' && submissionData.customerId.trim() === '')) {
        toast.error('Customer is required');
        setValidationErrors({ customerId: 'Customer is required' });
        return;
      }

      if (!submissionData.loadNumber || submissionData.loadNumber.trim() === '') {
        submissionData.loadNumber = `LOAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }

      if (!submissionData.loadType) submissionData.loadType = 'FTL';
      if (!submissionData.equipmentType) submissionData.equipmentType = 'DRY_VAN';
      if (submissionData.revenue === undefined || submissionData.revenue === null) submissionData.revenue = 0;

      const cleanedData: any = { ...submissionData };
      Object.keys(cleanedData).forEach((key) => {
        const value = cleanedData[key];
        if (value === '' || value === null) {
          if (!['customerId', 'loadNumber', 'loadType', 'equipmentType'].includes(key)) {
            delete cleanedData[key];
          }
        }
      });

      const validated = createLoadSchema.parse(cleanedData);
      createMutation.mutate(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
          errors[path] = issue.message;
        });
        setValidationErrors(errors);
        toast.error('Please fix validation errors');
      } else {
        toast.error(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Create Load</h1>
          <p className="text-xs text-muted-foreground">
            Import from Rate Con or enter manually
          </p>
        </div>
        <Link href={isSheet ? '#' : "/dashboard/loads"} onClick={(e) => {
          if (isSheet && onCancel) {
            e.preventDefault();
            onCancel();
          }
        }}>
          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Compact Stepper - Inline */}
      <div className="flex items-center gap-2 text-xs">
        {STEPS.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isComplete = currentStep > stepNum;
          return (
            <div key={step.label} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium ${isActive ? 'bg-primary text-primary-foreground' :
                isComplete ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                {isComplete ? '✓' : stepNum}
              </div>
              <span className={`${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
              {idx < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <Step1IntelligentIngestion
            onDataExtracted={handleDataExtracted}
            onSkipToManual={handleSkipToManual}
          />
        )}
        {currentStep === 2 && (
          <form
            id="create-load-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(loadData as CreateLoadInput);
            }}
          >
            {/* Resource Assignment - Inline in Step 2 */}
            <Card className="mb-4 shadow-sm">
              <CardHeader className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Resource Assignment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Driver</Label>
                    <DriverCombobox
                      value={loadData.driverId || ''}
                      onValueChange={(value) => {
                        handleFieldChange('driverId', value);
                        setLastDriverId(undefined);
                      }}
                      placeholder="Select driver..."
                      drivers={drivers}
                      className="h-8 text-xs"
                    />
                    {selectedDriver && (
                      <p className="text-[10px] text-muted-foreground">
                        {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Truck</Label>
                    <TruckCombobox
                      value={loadData.truckId || ''}
                      onValueChange={(value) => handleFieldChange('truckId', value)}
                      placeholder="Select truck..."
                      trucks={trucks}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Trailer</Label>
                    <TrailerCombobox
                      value={loadData.trailerNumber || ''}
                      onValueChange={(value) => handleFieldChange('trailerNumber', value)}
                      placeholder="Select trailer..."
                      trailers={trailers}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Section */}
            <Step3ReviewFinalization
              loadData={loadData}
              onFieldChange={handleFieldChange}
              errors={validationErrors}
            />
          </form>
        )}
      </div>

      {/* Navigation - Compact */}
      <div className="flex justify-between items-center pt-3 border-t">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="h-7 text-xs px-2"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>

          {savedDrafts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0">
                  <FileStack className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1 text-xs font-medium">Drafts ({savedDrafts.length})</div>
                <DropdownMenuSeparator />
                {savedDrafts.map((draft) => (
                  <DropdownMenuItem
                    key={draft.id}
                    className="text-xs cursor-pointer"
                    onClick={() => handleLoadDraft(draft.id)}
                  >
                    {draft.name || `Draft ${draft.id.slice(-6)}`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || Object.keys(loadData).length === 0}
            className="h-7 text-xs px-2"
          >
            {isSavingDraft ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Save Draft
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" size="sm" onClick={handleNext} className="h-7 text-xs px-2">
              Next <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              form="create-load-form"
              size="sm"
              disabled={createMutation.isPending}
              className="h-7 text-xs px-2"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Creating...</>
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
