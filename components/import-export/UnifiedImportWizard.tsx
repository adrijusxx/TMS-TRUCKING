'use client';

import { CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImportWizard } from '@/lib/hooks/useImportWizard';
import { ImportUploadStep } from './steps/ImportUploadStep';
import { ImportMappingStep } from './steps/ImportMappingStep';
import { ImportPreviewStep } from './steps/ImportPreviewStep';
import { ImportResultsStep } from './steps/ImportResultsStep';
import { ImportLogConsole } from './ImportLogConsole';

interface UnifiedImportWizardProps {
  entityType: string;
  mode?: 'sidebar' | 'fullpage';
  onImportComplete?: (data: any[]) => void;
  onClose?: () => void;
}

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Mapping' },
  { id: 3, label: 'Preview' },
  { id: 4, label: 'Results' },
];

export default function UnifiedImportWizard({
  entityType,
  mode = 'sidebar',
  onImportComplete,
  onClose,
}: UnifiedImportWizardProps) {
  const wizard = useImportWizard({ entityType, onImportComplete });
  const isSidebar = mode === 'sidebar';

  const showLogConsole =
    (wizard.importProgress.status !== 'idle' || wizard.logs.length > 0) &&
    !wizard.importDetails;

  // Results step is triggered by importDetails, not activeStep state
  const effectiveStep = wizard.importDetails ? 4 : wizard.activeStep;

  return (
    <div className={`flex flex-col ${isSidebar ? 'h-full bg-background' : 'container mx-auto py-8 px-4 max-w-4xl'}`}>
      {/* Step Indicator */}
      {!isSidebar && <StepIndicator activeStep={effectiveStep} />}

      {/* Content */}
      {isSidebar ? (
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="space-y-8 pb-20">
            <WizardContent wizard={wizard} isSidebar={isSidebar} />
          </div>
        </ScrollArea>
      ) : (
        <div className="bg-card border rounded-lg p-6">
          <WizardContent wizard={wizard} isSidebar={isSidebar} />
        </div>
      )}

      {/* Log Console (pinned to bottom in sidebar mode) */}
      {isSidebar && (
        <ImportLogConsole
          importProgress={wizard.importProgress}
          logs={wizard.logs}
          logsEndRef={wizard.logsEndRef}
          visible={showLogConsole}
        />
      )}
    </div>
  );
}

function StepIndicator({ activeStep }: { activeStep: number }) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      {STEPS.map((step) => (
        <div key={step.id} className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            activeStep === step.id
              ? 'bg-primary text-primary-foreground border-primary'
              : step.id < activeStep
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-muted border-muted-foreground/20'
          }`}>
            {step.id < activeStep ? <CheckCircle2 className="h-5 w-5" /> : step.id}
          </div>
          <div className="font-semibold">{step.label}</div>
        </div>
      ))}
    </div>
  );
}

function WizardContent({ wizard, isSidebar }: { wizard: ReturnType<typeof useImportWizard>; isSidebar: boolean }) {
  // Step 4: Results (shown when import is complete)
  if (wizard.importDetails) {
    return (
      <StepSection step={4} activeStep={4} label="Import Results" isSidebar={isSidebar}>
        <ImportResultsStep wizard={wizard} />
      </StepSection>
    );
  }

  return (
    <>
      {/* Step 1: Upload */}
      <StepSection step={1} activeStep={wizard.activeStep} label="Select File" isSidebar={isSidebar}
        onEdit={wizard.activeStep !== 1 ? () => wizard.setActiveStep(1) : undefined}
        completed={!!wizard.selectedFile}
      >
        {(wizard.activeStep === 1 || !wizard.selectedFile) && (
          <ImportUploadStep wizard={wizard} />
        )}
      </StepSection>

      {/* Step 2: Mapping */}
      {wizard.selectedFile && wizard.importResult && (
        <StepSection step={2} activeStep={wizard.activeStep} label="Field Mapping" isSidebar={isSidebar}
          onEdit={wizard.activeStep !== 2 ? () => wizard.setActiveStep(2) : undefined}
          completed={wizard.activeStep > 2}
        >
          {wizard.activeStep === 2 && (
            <ImportMappingStep wizard={wizard} />
          )}
        </StepSection>
      )}

      {/* Step 3: Preview */}
      {wizard.previewData && wizard.activeStep === 3 && (
        <StepSection step={3} activeStep={wizard.activeStep} label="Review Import Preview" isSidebar={isSidebar}>
          <ImportPreviewStep wizard={wizard} />
        </StepSection>
      )}
    </>
  );
}

interface StepSectionProps {
  step: number;
  activeStep: number;
  label: string;
  isSidebar: boolean;
  onEdit?: () => void;
  completed?: boolean;
  children: React.ReactNode;
}

function StepSection({ step, activeStep, label, isSidebar, onEdit, completed, children }: StepSectionProps) {
  if (!isSidebar) {
    // Full-page mode: only show active step content
    if (step !== activeStep && !completed) return null;
    if (step !== activeStep) return null;
    return <>{children}</>;
  }

  // Sidebar mode: show all steps with opacity transitions
  return (
    <section className={`space-y-4 transition-opacity ${activeStep !== step ? 'opacity-60 hover:opacity-100' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
            activeStep === step
              ? 'bg-primary text-primary-foreground border-primary'
              : completed
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-muted'
          }`}>
            {completed && activeStep !== step ? <CheckCircle2 className="w-3 h-3" /> : step}
          </span>
          {label}
        </h3>
        {onEdit && activeStep !== step && (
          <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
        )}
      </div>
      {children}
    </section>
  );
}
