'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface SelectedFileDisplayProps {
  file: File;
  onRemove: () => void;
}

export function SelectedFileDisplay({ file, onRemove }: SelectedFileDisplayProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
      <FileText className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(2)} KB
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}





