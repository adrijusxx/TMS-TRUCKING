'use client';

import { useState } from 'react';
import type { OnboardingStep3Input, ImportEntity } from '@/lib/validations/onboarding';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, Truck, Users, Package, Building2, SkipForward, Check, FileBox, FileText, DollarSign, ChevronRight, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleImportModal } from './SimpleImportModal';

interface Step3ImportDataProps {
    onComplete: (data: OnboardingStep3Input) => void;
    isLoading?: boolean;
    companyId?: string;
}

interface ImportStep {
    step: number;
    title: string;
    description: string;
    entities: {
        id: ImportEntity;
        label: string;
        icon: React.ReactNode;
    }[];
    note?: string;
}

// Import steps in proper dependency order
const IMPORT_STEPS: ImportStep[] = [
    {
        step: 1,
        title: 'Fleet & Team',
        description: 'Start with your core assets - these have no dependencies',
        entities: [
            { id: 'drivers' as ImportEntity, label: 'Drivers', icon: <Users className="h-4 w-4" /> },
            { id: 'trucks' as ImportEntity, label: 'Trucks', icon: <Truck className="h-4 w-4" /> },
            { id: 'trailers' as ImportEntity, label: 'Trailers', icon: <Package className="h-4 w-4" /> },
        ],
        note: 'Import these first - they don\'t depend on other data',
    },
    {
        step: 2,
        title: 'Business Partners',
        description: 'Your brokers and customers',
        entities: [
            { id: 'customers' as ImportEntity, label: 'Customers/Brokers', icon: <Building2 className="h-4 w-4" /> },
        ],
        note: 'Required for linking loads to brokers',
    },
    {
        step: 3,
        title: 'Loads',
        description: 'Your load/freight history',
        entities: [
            { id: 'loads' as ImportEntity, label: 'Loads', icon: <FileBox className="h-4 w-4" /> },
        ],
        note: 'Links to drivers, trucks, trailers & customers',
    },
    {
        step: 4,
        title: 'Financial Records',
        description: 'Invoice and settlement history',
        entities: [
            { id: 'invoices' as ImportEntity, label: 'Invoices', icon: <FileText className="h-4 w-4" /> },
            { id: 'settlements' as ImportEntity, label: 'Settlements', icon: <DollarSign className="h-4 w-4" /> },
        ],
        note: 'These link to loads and drivers',
    },
];

export function Step3ImportData({ onComplete, isLoading }: Step3ImportDataProps) {
    const [expandedStep, setExpandedStep] = useState<number | null>(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // Import state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [activeEntity, setActiveEntity] = useState<ImportEntity | null>(null);
    const [importedData, setImportedData] = useState<Record<string, any[]>>({});

    const handleSkip = () => {
        onComplete({ skipImport: true });
    };

    const handleContinue = () => {
        onComplete({
            skipImport: Object.keys(importedData).length === 0,
            importedData: importedData,
            importedEntities: Object.keys(importedData) as ImportEntity[]
        });
    };

    const markStepComplete = (stepNum: number) => {
        if (!completedSteps.includes(stepNum)) {
            setCompletedSteps(prev => [...prev, stepNum]);
            // Expand next step
            if (stepNum < IMPORT_STEPS.length) {
                setExpandedStep(stepNum + 1);
            }
        }
    };

    const openImportModal = (entity: ImportEntity) => {
        setActiveEntity(entity);
        setImportModalOpen(true);
    };

    const handleImport = (data: any[], options?: { updateExisting: boolean }) => {
        if (activeEntity) {
            setImportedData(prev => {
                const existing = prev[activeEntity] || [];

                if (options?.updateExisting) {
                    // Primitive deduplication based on common keys
                    const uniqueKey = activeEntity === 'loads' ? 'loadNumber' :
                        activeEntity === 'drivers' ? 'email' :
                            activeEntity === 'trucks' ? 'truckNumber' :
                                activeEntity === 'trailers' ? 'trailerNumber' : 'name';

                    const merged = [...existing];
                    data.forEach(newRow => {
                        const idx = merged.findIndex(r => r[uniqueKey] === newRow[uniqueKey]);
                        if (idx >= 0) {
                            merged[idx] = { ...merged[idx], ...newRow };
                        } else {
                            merged.push(newRow);
                        }
                    });
                    return { ...prev, [activeEntity]: merged };
                }

                return {
                    ...prev,
                    [activeEntity]: [...existing, ...data]
                };
            });
        }
    };

    // Check if an entity has data
    const getEntityCount = (entityId: string) => importedData[entityId]?.length || 0;

    return (
        <div>
            <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-5 w-5 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">Import Your Data</h2>
                </div>
                <p className="text-slate-400 text-sm">
                    Follow the order below for best results
                </p>
            </div>

            {/* Guided Import Steps */}
            <div className="space-y-2 mb-5">
                {IMPORT_STEPS.map((importStep) => {
                    const isExpanded = expandedStep === importStep.step;
                    const isCompleted = completedSteps.includes(importStep.step);
                    const canExpand = importStep.step === 1 || completedSteps.includes(importStep.step - 1);

                    // Check if all entities in this step have data
                    const stepHasData = importStep.entities.every(e => getEntityCount(e.id) > 0);

                    return (
                        <div
                            key={importStep.step}
                            className={cn(
                                'rounded-lg border transition-all',
                                isCompleted ? 'border-green-500/50 bg-green-500/5' :
                                    isExpanded ? 'border-purple-500/50 bg-purple-500/5' :
                                        canExpand ? 'border-slate-700 bg-slate-900 hover:border-slate-600' :
                                            'border-slate-800 bg-slate-900/50 opacity-60'
                            )}
                        >
                            {/* Header */}
                            <button
                                type="button"
                                onClick={() => canExpand && setExpandedStep(isExpanded ? null : importStep.step)}
                                disabled={!canExpand}
                                className="w-full p-3 flex items-center gap-3 text-left"
                            >
                                <div className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                    isCompleted ? 'bg-green-500 text-white' :
                                        stepHasData ? 'bg-blue-500 text-white' :
                                            isExpanded ? 'bg-purple-500 text-white' :
                                                'bg-slate-700 text-slate-400'
                                )}>
                                    {isCompleted ? '✓' : importStep.step}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={cn(
                                        'font-medium text-sm',
                                        isCompleted ? 'text-green-400' : isExpanded ? 'text-white' : 'text-slate-400'
                                    )}>
                                        {importStep.title}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">{importStep.description}</div>
                                </div>
                                <ChevronRight className={cn(
                                    'h-4 w-4 text-slate-500 transition-transform',
                                    isExpanded && 'rotate-90'
                                )} />
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && !isCompleted && (
                                <div className="px-3 pb-3 pt-0">
                                    {/* Individual Import Buttons */}
                                    <div className="space-y-2 mb-3">
                                        {importStep.entities.map((entity) => {
                                            const count = getEntityCount(entity.id);
                                            return (
                                                <div key={entity.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700/50">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded bg-slate-800 text-slate-400">
                                                            {entity.icon}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-300">{entity.label}</div>
                                                            {count > 0 && <div className="text-xs text-green-400">{count} records ready</div>}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={count > 0 ? "secondary" : "outline"}
                                                        className={cn(
                                                            "h-7 text-xs",
                                                            count > 0 ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20" : "border-slate-600 text-slate-300"
                                                        )}
                                                        onClick={() => openImportModal(entity.id)}
                                                    >
                                                        {count > 0 ? 'Add More' : 'Import CSV'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Note */}
                                    {importStep.note && (
                                        <div className="flex items-start gap-2 text-xs text-slate-500 mb-3">
                                            <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                            {importStep.note}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex justify-between items-center">
                                        {importStep.step > 1 ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs text-slate-400 hover:text-white"
                                                onClick={() => setExpandedStep(importStep.step - 1)}
                                            >
                                                Previous
                                            </Button>
                                        ) : <div />}
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs bg-purple-600 hover:bg-purple-500"
                                            onClick={() => markStepComplete(importStep.step)}
                                        >
                                            Next Step
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Help/Documentation Section */}
            <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 mb-6">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <AlertCircle className="h-4 w-4" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Help & Instructions</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                    <p>• <strong className="text-slate-300">File Formats:</strong> We support .csv, .xlsx, and .xls files.</p>
                    <p>• <strong className="text-slate-300">Smart Mapping:</strong> Match your columns to our system. If it misses any, you can manually map them.</p>
                    <p>• <strong className="text-slate-300">Zero-Failure Policy:</strong> Missing fields like VIN or Expiry dates will be auto-filled with secure placeholders.</p>
                    <p>• <strong className="text-slate-300">Finish Later:</strong> You can always import more data later from Settings → Import/Export.</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
                <Button
                    type="button"
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 h-10"
                    disabled={isLoading}
                >
                    Continue to Plan Selection
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full text-slate-400 hover:text-white h-9"
                    disabled={isLoading}
                >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip All Imports
                </Button>
            </div>

            {importModalOpen && activeEntity && (
                <SimpleImportModal
                    isOpen={importModalOpen}
                    onClose={() => setImportModalOpen(false)}
                    entityType={activeEntity}
                    onImport={handleImport}
                />
            )}
        </div>
    );
}
