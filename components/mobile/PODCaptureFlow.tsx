'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Camera, FileCheck, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import CameraCapture from './CameraCapture';
import SignaturePad from './SignaturePad';

interface PODCaptureFlowProps {
  loadId: string;
  loadNumber: string;
  currentStatus: string;
}

type Step = 'photos' | 'signature' | 'review';

async function uploadFile(file: File, loadId: string, type: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('loadId', loadId);
  formData.append('type', type);
  formData.append('title', `${type} - ${file.name}`);

  const response = await fetch(apiUrl('/api/documents/upload'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload file');
  }

  const result = await response.json();
  return result.data.id;
}

async function submitPOD(
  loadId: string,
  documentId: string,
  notes?: string
) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}/pod-upload`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to submit POD');
  }

  return response.json();
}

function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new File([u8arr], filename, { type: mime });
}

export default function PODCaptureFlow({
  loadId,
  loadNumber,
  currentStatus,
}: PODCaptureFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('photos');
  const [photos, setPhotos] = useState<File[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (photos.length === 0) throw new Error('At least one photo is required');

      // Upload photos
      const photoIds: string[] = [];
      for (const photo of photos) {
        const id = await uploadFile(photo, loadId, 'POD');
        photoIds.push(id);
      }

      // Upload signature if provided
      if (signatureDataUrl) {
        await uploadFile(
          dataURLtoFile(signatureDataUrl, `signature-${loadNumber}.png`),
          loadId,
          'POD'
        );
      }

      // Submit POD using the first photo as the primary document
      return submitPOD(loadId, photoIds[0], notes || undefined);
    },
    onSuccess: () => {
      toast.success('POD submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['driver-load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['driver-loads'] });
      resetFlow();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit POD');
    },
  });

  const resetFlow = () => {
    setOpen(false);
    setStep('photos');
    setPhotos([]);
    setSignatureDataUrl(null);
    setNotes('');
  };

  // Only show for appropriate statuses
  const canCapturePOD = ['AT_DELIVERY', 'DELIVERED'].includes(currentStatus);
  if (!canCapturePOD) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetFlow(); }}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" variant="default">
          <Camera className="h-5 w-5 mr-2" />
          Capture POD
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Proof of Delivery — Load #{loadNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {(['photos', 'signature', 'review'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : i < ['photos', 'signature', 'review'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px bg-muted" />}
            </div>
          ))}
        </div>

        {/* Step: Photos */}
        {step === 'photos' && (
          <div className="space-y-4">
            <CameraCapture
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={5}
              label="Delivery Photos"
            />
            <Button
              className="w-full"
              onClick={() => setStep('signature')}
              disabled={photos.length === 0}
            >
              Next: Signature
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Signature */}
        {step === 'signature' && (
          <div className="space-y-4">
            <SignaturePad onSignatureChange={setSignatureDataUrl} />
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any delivery notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('photos')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep('review')}>
                Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Review & Submit */}
        {step === 'review' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photos</span>
                  <span>{photos.length} captured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signature</span>
                  <span>{signatureDataUrl ? 'Signed' : 'Not signed'}</span>
                </div>
                {notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1">{notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('signature')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Submit POD
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
