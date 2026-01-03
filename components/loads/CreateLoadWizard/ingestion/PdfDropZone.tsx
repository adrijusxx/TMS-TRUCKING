'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PdfDropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function PdfDropZone({ onFileSelect, disabled }: PdfDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    onFileSelect(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Drag and drop your Rate Confirmation PDF here
          </p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          id="pdf-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <FileText className="h-4 w-4 mr-2" />
          Select PDF File
        </Button>
      </div>
    </div>
  );
}





