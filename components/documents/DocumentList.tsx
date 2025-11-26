'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, Trash2, Search, Filter } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';

interface Document {
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
  RATE_CONFIRMATION: 'Rate Confirmation',
  DRIVER_LICENSE: 'Driver License',
  MEDICAL_CARD: 'Medical Card',
  INSURANCE: 'Insurance',
  COI: 'Certificate of Insurance',
  REGISTRATION: 'Registration',
  INSPECTION: 'Inspection',
  LEASE_AGREEMENT: 'Lease Agreement',
  W9: 'W9 Form',
  OTHER: 'Other',
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function fetchDocuments(params: {
  page?: number;
  limit?: number;
  type?: string;
  loadId?: string;
  driverId?: string;
  truckId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.type) queryParams.set('type', params.type);
  if (params.loadId) queryParams.set('loadId', params.loadId);
  if (params.driverId) queryParams.set('driverId', params.driverId);
  if (params.truckId) queryParams.set('truckId', params.truckId);

  const response = await fetch(apiUrl(`/api/documents?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
}

interface DocumentListProps {
  loadId?: string;
  driverId?: string;
  truckId?: string;
}

export default function DocumentList({
  loadId,
  driverId,
  truckId,
}: DocumentListProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents', page, typeFilter, loadId, driverId, truckId],
    queryFn: () =>
      fetchDocuments({
        page,
        limit: 20,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        loadId,
        driverId,
        truckId,
      }),
  });

  const documents: Document[] = data?.data || [];
  const meta = data?.meta;

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const response = await fetch(apiUrl(`/api/documents/${documentId}`), {
      method: 'DELETE',
    });

    if (response.ok) {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (loadId) {
        queryClient.invalidateQueries({ queryKey: ['loads', loadId] });
      }
      if (driverId) {
        queryClient.invalidateQueries({ queryKey: ['drivers', driverId] });
      }
      if (truckId) {
        queryClient.invalidateQueries({ queryKey: ['trucks', truckId] });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">Manage uploaded documents</p>
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(documentTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading documents...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading documents. Please try again.
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No documents found</p>
          <p className="text-muted-foreground">
            Upload your first document to get started
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.fileName}</span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {documentTypeLabels[doc.type] || doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.load && (
                        <Link
                          href={`/dashboard/loads/${doc.load.loadNumber}`}
                          className="text-primary hover:underline"
                        >
                          Load: {doc.load.loadNumber}
                        </Link>
                      )}
                      {doc.driver && (
                        <div>
                          Driver: {doc.driver.user.firstName}{' '}
                          {doc.driver.user.lastName}
                        </div>
                      )}
                      {doc.truck && (
                        <div>Truck: {doc.truck.truckNumber}</div>
                      )}
                      {!doc.load && !doc.driver && !doc.truck && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                    </TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {(() => {
                          // Dispatchers can delete BOL, POD, and RATE_CONFIRMATION
                          // Other roles need full documents.delete permission
                          const isDispatcher = session?.user?.role === 'DISPATCHER';
                          const isCriticalDoc = ['BOL', 'POD', 'RATE_CONFIRMATION'].includes(doc.type);
                          const canDelete = isDispatcher 
                            ? isCriticalDoc 
                            : can('documents.delete');
                          
                          return canDelete ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                              title={isDispatcher && !isCriticalDoc ? 'Dispatchers can only delete BOL, POD, and Rate Confirmation documents' : 'Delete document'}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null;
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to{' '}
                {Math.min(page * 20, meta.total)} of {meta.total} documents
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

