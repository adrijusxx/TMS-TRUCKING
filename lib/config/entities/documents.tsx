import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface DocumentData {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  createdAt: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
  load?: {
    loadNumber: string;
  };
  driver?: {
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  truck?: {
    truckNumber: string;
  };
}

const documentTypeLabels: Record<string, string> = {
  BOL: 'Bill of Lading',
  POD: 'Proof of Delivery',
  INVOICE: 'Invoice',
  SETTLEMENT: 'Settlement',
  LICENSE: 'License',
  MEDICAL_CARD: 'Medical Card',
  INSURANCE: 'Insurance',
  INSPECTION: 'Inspection',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const columns: ExtendedColumnDef<DocumentData>[] = [
  {
    id: 'fileName',
    accessorKey: 'fileName',
    header: 'File Name',
    cell: ({ row }) => (
      <div>
        <a
          href={row.original.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          {row.original.fileName}
        </a>
      </div>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const typeLabel = documentTypeLabels[row.original.type] || row.original.type;
      // Filter to show only POD and RATE_CONFIRMATION prominently, others as-is
      const displayType = ['POD', 'RATE_CONFIRMATION'].includes(row.original.type) 
        ? typeLabel 
        : typeLabel;
      return (
        <Badge variant="outline">
          {displayType}
        </Badge>
      );
    },
    defaultVisible: true,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Upload Date',
    cell: ({ row }) => formatDate(new Date(row.original.createdAt)),
    defaultVisible: true,
  },
  {
    id: 'relatedTo',
    header: 'Related Entity',
    cell: ({ row }) => {
      if (row.original.load) {
        return (
          <Link
            href={`/dashboard/loads/${row.original.load.loadNumber}`}
            className="text-primary hover:underline"
          >
            Load: {row.original.load.loadNumber}
          </Link>
        );
      }
      if (row.original.driver) {
        return (
          <div>
            Driver: {row.original.driver.user.firstName} {row.original.driver.user.lastName}
          </div>
        );
      }
      if (row.original.truck) {
        return (
          <Link
            href={`/dashboard/trucks/${row.original.truck.truckNumber}`}
            className="text-primary hover:underline"
          >
            Truck: {row.original.truck.truckNumber}
          </Link>
        );
      }
      return 'N/A';
    },
    defaultVisible: true,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: Object.keys(documentTypeLabels).map((type) => ({
      value: type,
      label: documentTypeLabels[type],
    })),
    permission: 'documents.edit',
  },
  {
    key: 'mcNumberId',
    label: 'MC Number',
    type: 'select',
    options: [], // Will be populated dynamically by BulkEditDialog
    permission: 'mc_numbers.edit',
    placeholder: 'Select MC number',
  },
];

export const documentsTableConfig = createEntityTableConfig<DocumentData>({
  entityType: 'documents',
  columns,
  defaultVisibleColumns: ['fileName', 'type', 'createdAt', 'relatedTo'],
  requiredColumns: ['fileName'],
  bulkEditFields,
  defaultSort: [{ id: 'createdAt', desc: true }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: false, // Documents are uploaded, not imported
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: Object.keys(documentTypeLabels).map((type) => ({
        value: type,
        label: documentTypeLabels[type],
      })),
    },
  ],
});

