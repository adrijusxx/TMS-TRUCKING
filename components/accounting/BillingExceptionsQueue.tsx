'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, FileText, Upload, CheckCircle, Loader2, FileX } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import DocumentUpload from '@/components/documents/DocumentUpload';

interface BillingExceptionLoad {
  id: string;
  loadNumber: string;
  customerName: string;
  customerNumber: string;
  isBillingHold: boolean;
  billingHoldReason: string | null;
  status: string;
  deliveryDate: string | null;
  ageInDays: number | null;
  hasPOD: boolean;
  missingPOD: boolean;
}

export function BillingExceptionsQueue() {
  const [loads, setLoads] = useState<BillingExceptionLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [forceReleaseModalOpen, setForceReleaseModalOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<BillingExceptionLoad | null>(null);
  const [releaseComment, setReleaseComment] = useState('');
  const [uploadPODModalOpen, setUploadPODModalOpen] = useState(false);
  const [invoiceEligibility, setInvoiceEligibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const response = await fetch('/api/loads/billing-exceptions');
      const data = await response.json();

      if (data.success) {
        setLoads(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to load billing exceptions');
      }
    } catch (error) {
      console.error('Error fetching billing exceptions:', error);
      toast.error('Failed to load billing exceptions');
    } finally {
      setLoading(false);
    }
  };

  const handleForceRelease = async () => {
    if (!selectedLoad || !releaseComment.trim()) {
      toast.error('Please provide a reason for force release');
      return;
    }

    setProcessingId(selectedLoad.id);
    try {
      const response = await fetch(`/api/loads/${selectedLoad.id}/force-release`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: releaseComment }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Billing hold cleared successfully');
        setForceReleaseModalOpen(false);
        setReleaseComment('');
        setSelectedLoad(null);
        fetchLoads();
      } else {
        throw new Error(data.error?.message || 'Failed to force release');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to force release billing hold');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUploadPOD = (loadId: string) => {
    const load = loads.find((l) => l.id === loadId);
    if (load) {
      setSelectedLoad(load);
      setUploadPODModalOpen(true);
    }
  };

  const handleGenerateInvoice = async (loadId: string) => {
    setProcessingId(loadId);
    try {
      // Check if load is ready to bill
      const response = await fetch(`/api/loads/${loadId}/invoice-eligibility`);
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error?.message || 'Failed to check invoice eligibility');
        return;
      }

      const result = data.data;

      if (!result.ready) {
        toast.error(`Cannot generate invoice: ${result.reasons?.join(', ') || 'Validation failed'}`);
        return;
      }

      // Navigate to invoice generation page with pre-selected load
      window.location.href = `/dashboard/invoices/generate?loadIds=${loadId}`;
    } catch (error: any) {
      toast.error(error.message || 'Failed to check invoice eligibility');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    // Pre-check invoice eligibility for all loads
    const checkEligibility = async () => {
      const eligibilityMap: Record<string, boolean> = {};
      await Promise.all(
        loads.map(async (load) => {
          if (!load.isBillingHold) {
            try {
              const response = await fetch(`/api/loads/${load.id}/invoice-eligibility`);
              const data = await response.json();
              if (data.success) {
                eligibilityMap[load.id] = data.data.ready;
              }
            } catch (error) {
              console.error(`Error checking eligibility for ${load.id}:`, error);
            }
          }
        })
      );
      setInvoiceEligibility(eligibilityMap);
    };

    if (loads.length > 0) {
      checkEligibility();
    }
  }, [loads]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Exceptions Queue</CardTitle>
          <CardDescription>Loading billing exceptions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Billing Exceptions Queue</CardTitle>
          <CardDescription>
            {loads.length} load{loads.length !== 1 ? 's' : ''} requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No billing exceptions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Warning Flag</TableHead>
                  <TableHead>Missing Docs</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/loads/${load.id}`}
                        className="hover:underline text-primary"
                      >
                        {load.loadNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{load.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          #{load.customerNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {load.isBillingHold && load.billingHoldReason ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 text-sm max-w-xs truncate">
                            {load.billingHoldReason}
                          </span>
                        </div>
                      ) : load.status === 'READY_TO_BILL' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Ready to Bill
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {load.missingPOD ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <FileX className="h-4 w-4" />
                          <span className="text-sm">POD Missing</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Complete</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {load.ageInDays !== null ? (
                        <div>
                          <span className="font-medium">{load.ageInDays}</span>
                          <span className="text-xs text-muted-foreground ml-1">days</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLoad(load);
                            setForceReleaseModalOpen(true);
                          }}
                          disabled={!load.isBillingHold || processingId === load.id}
                        >
                          Force Release
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUploadPOD(load.id)}
                          disabled={processingId === load.id}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload POD
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGenerateInvoice(load.id)}
                          disabled={
                            processingId === load.id ||
                            load.isBillingHold ||
                            (invoiceEligibility[load.id] === false)
                          }
                          title={
                            load.isBillingHold
                              ? 'Cannot generate invoice: Load is on billing hold'
                              : invoiceEligibility[load.id] === false
                              ? 'Cannot generate invoice: Validation failed'
                              : 'Generate invoice for this load'
                          }
                        >
                          {processingId === load.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-1" />
                              Generate Invoice
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Force Release Modal */}
      <Dialog open={forceReleaseModalOpen} onOpenChange={setForceReleaseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Release Billing Hold</DialogTitle>
            <DialogDescription>
              Clear the billing hold for load {selectedLoad?.loadNumber}. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLoad?.billingHoldReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800">Current Hold Reason:</p>
                <p className="text-sm text-red-600 mt-1">{selectedLoad.billingHoldReason}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="release-comment">
                Reason for Force Release <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="release-comment"
                value={releaseComment}
                onChange={(e) => setReleaseComment(e.target.value)}
                placeholder="Explain why you are force releasing this billing hold..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setForceReleaseModalOpen(false);
                setReleaseComment('');
                setSelectedLoad(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForceRelease}
              disabled={!releaseComment.trim() || processingId === selectedLoad?.id}
            >
              {processingId === selectedLoad?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Releasing...
                </>
              ) : (
                'Force Release'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload POD Modal */}
      <Dialog open={uploadPODModalOpen} onOpenChange={setUploadPODModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload POD Document</DialogTitle>
            <DialogDescription>
              Upload Proof of Delivery for load {selectedLoad?.loadNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedLoad && (
              <DocumentUpload
                loadId={selectedLoad.id}
                defaultType="POD"
                onSuccess={() => {
                  toast.success('POD uploaded successfully');
                  setUploadPODModalOpen(false);
                  setSelectedLoad(null);
                  fetchLoads();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

