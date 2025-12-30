'use client';

import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import BulkImportSidebar from './BulkImportSidebar';
import AILoadImporter from '@/components/loads/AILoadImporter';

interface ImportSheetProps {
    entityType: string;
    trigger?: React.ReactNode;
    onImportComplete?: (data: any[]) => void;
    onAIImport?: (data: any, file?: File) => void;
    children?: React.ReactNode; // Can be used as trigger
}

export default function ImportSheet({
    entityType,
    trigger,
    onImportComplete,
    onAIImport,
    children
}: ImportSheetProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('bulk');

    const title = `Import ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;

    // Determine if we should show tabs (only for loads right now)
    const showTabs = entityType === 'loads';

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || children || (
                    <Button variant="outline" size="sm" className="hidden">
                        Import
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[700px] p-0 flex flex-col h-full bg-background" side="right">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="text-xl">{title}</SheetTitle>
                    <SheetDescription>
                        Add new {entityType} to your system.
                    </SheetDescription>
                </SheetHeader>

                {showTabs ? (
                    <Tabs defaultValue="bulk" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-2 border-b bg-muted/30">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="bulk" className="flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Bulk Import
                                </TabsTrigger>
                                <TabsTrigger value="ai" className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> AI Rate Con
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="bulk" className="flex-1 min-h-0 m-0 relative">
                            <BulkImportSidebar
                                entityType={entityType}
                                onImportComplete={(data) => {
                                    if (onImportComplete) onImportComplete(data);
                                    // Optional: Close on success?
                                }}
                                onClose={() => setOpen(false)}
                            />
                        </TabsContent>

                        <TabsContent value="ai" className="flex-1 min-h-0 m-0 overflow-y-auto px-6 py-6">
                            {/* 
                  Refactoring Note: AILoadImporter currently has its own Card wrapper.
                  Ideally we should strip that or make it optional.
                  For now, we'll render it as is, but it might look nested.
                */}
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Upload a Rate Confirmation PDF and we'll extract the details for you.
                                </p>
                                <AILoadImporter
                                    onDataExtracted={(data, file) => {
                                        if (onAIImport) {
                                            onAIImport(data, file);
                                            setOpen(false);
                                        }
                                    }}
                                    onClose={() => setOpen(false)}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="flex-1 min-h-0 relative">
                        <BulkImportSidebar
                            entityType={entityType}
                            onImportComplete={(data) => {
                                if (onImportComplete) onImportComplete(data);
                            }}
                            onClose={() => setOpen(false)}
                        />
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
