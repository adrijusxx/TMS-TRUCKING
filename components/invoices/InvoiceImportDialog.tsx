'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InvoiceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceImportDialog({
  open,
  onOpenChange,
}: InvoiceImportDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl('/api/invoices/import'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to import invoices');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setFile(null);
      setProgress(0);
      onOpenChange(false);
      alert(
        `Import completed!\nCreated: ${data.data.created}\nUpdated: ${data.data.updated}\nErrors: ${data.data.errorCount}`
      );
    },
    onError: (error: any) => {
      alert(`Import failed: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    // Simulate progress for large files
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += 10;
      setProgress(Math.min(progressValue, 90));
      if (progressValue >= 90) {
        clearInterval(progressInterval);
      }
    }, 500);

    importMutation.mutate(file, {
      onSettled: () => {
        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Invoices</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import invoices. Supports up to 5000 invoices per import.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="invoice-import-file"
            />
            <label
              htmlFor="invoice-import-file"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : 'Select File'}
            </label>
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing invoices...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Supported columns:</p>
            <p className="text-xs">
              Batch ID, Customer name, Invoice ID, Load ID, MC number, Driver/Carrier, Unit number,
              Delivery appointment, Payment date, Date, Collected date, Invoice status, Sub status,
              Aging days, Aging status, Accrual, Paid, Balance due, Reconciliation, Reconciliation
              status, Dispatcher, Invoice note, Invoice note auth, Payment note
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                onOpenChange(false);
              }}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import Invoices
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

