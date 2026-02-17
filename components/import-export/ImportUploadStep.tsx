'use client';

import { useRef, useCallback } from 'react';
import { Upload, FileText, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ImportUploadStepProps {
    onFileSelect: (file: File) => void;
    isProcessing: boolean;
    selectedFile: File | null;
    onReset: () => void;
}

export function ImportUploadStep({
    onFileSelect,
    isProcessing,
    selectedFile,
    onReset,
}: ImportUploadStepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div>
            <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-primary rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Upload your file</p>
                <p className="text-sm text-muted-foreground mb-4">
                    Select your sheet in .xlsx, .xls or .csv format or drag & drop
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </div>

            {isProcessing && (
                <div className="mt-4">
                    <Progress value={50} className="mb-2" />
                    <p className="text-sm text-muted-foreground text-center">Processing file...</p>
                </div>
            )}

            {selectedFile && !isProcessing && (
                <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-sm text-muted-foreground">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onReset}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
