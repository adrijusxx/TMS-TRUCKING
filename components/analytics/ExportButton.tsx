'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileJson } from 'lucide-react';
import { exportToCSV, exportToJSON } from '@/lib/export';

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers?: string[];
}

export default function ExportButton({ data, filename, headers }: ExportButtonProps) {
  if (data.length === 0) {
    return null;
  }

  const handleCSVExport = () => {
    if (headers) {
      exportToCSV(data, headers, `${filename}.csv`);
    } else {
      // Auto-generate headers from first row
      const autoHeaders = Object.keys(data[0] || {});
      exportToCSV(data, autoHeaders, `${filename}.csv`);
    }
  };

  const handleJSONExport = () => {
    exportToJSON(data, `${filename}.json`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSVExport}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleJSONExport}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

