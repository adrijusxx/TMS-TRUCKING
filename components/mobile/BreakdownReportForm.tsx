'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Send, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { fetchTrucks, fetchCurrentTruck, reportBreakdown, type TruckOption } from './breakdown-report/api';
import { convertFilesToDataUrls } from './breakdown-report/convertFilesToDataUrls';
import { useBreakdownLocation } from './breakdown-report/useBreakdownLocation';
import MediaUploadSection from './breakdown-report/MediaUploadSection';
import { useEffect } from 'react';

export default function BreakdownReportForm() {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const [truckId, setTruckId] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const loc = useBreakdownLocation();

  const { data: currentTruckData } = useQuery({
    queryKey: ['driver-current-truck'],
    queryFn: fetchCurrentTruck,
  });

  const { data: trucksData } = useQuery({
    queryKey: ['driver-trucks'],
    queryFn: fetchTrucks,
  });

  const trucks: TruckOption[] = trucksData?.data?.trucks || trucksData?.data || [];

  // Auto-set truck when current truck is loaded
  useEffect(() => {
    if (currentTruckData?.data?.truck?.id) {
      const truckIdFromData = currentTruckData.data.truck.id;
      if (!truckId || truckId !== truckIdFromData) setTruckId(truckIdFromData);
    }
  }, [currentTruckData?.data?.truck?.id, truckId]);

  const reportMutation = useMutation({
    mutationFn: reportBreakdown,
    onSuccess: (data) => {
      isSubmittingRef.current = false;
      toast.success(`Breakdown case ${data.data.breakdown.breakdownNumber} created!`);
      router.push(`/mobile/driver/breakdowns/${data.data.breakdown.id}`);
    },
    onError: (error: Error) => {
      isSubmittingRef.current = false;
      toast.error(error.message || 'Failed to report breakdown');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmittingRef.current || reportMutation.isPending) return;
    isSubmittingRef.current = true;

    if (!description.trim()) {
      toast.error('Please describe the breakdown issue');
      isSubmittingRef.current = false;
      return;
    }

    const finalTruckId = truckId || currentTruckData?.data?.truck?.id;
    if (!finalTruckId) {
      isSubmittingRef.current = false;
      toast.error('Please select a truck to report the breakdown for.');
      return;
    }
    if (truckId !== finalTruckId) setTruckId(finalTruckId);

    const finalLocation = loc.location || 'Location not available - please update';

    let mediaUrls: string[] = [];
    if (mediaFiles.length > 0) {
      const totalFileSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);
      const totalFileSizeMB = totalFileSize / 1024 / 1024;

      if (totalFileSizeMB > 40) {
        toast.error(`Total file size (${totalFileSizeMB.toFixed(2)}MB) exceeds 40MB limit.`);
        isSubmittingRef.current = false;
        return;
      }

      const videoCount = mediaFiles.filter(f => f.type.startsWith('video/')).length;
      const imageCount = mediaFiles.filter(f => f.type.startsWith('image/')).length;
      const fileTypes = videoCount > 0 && imageCount > 0
        ? `${imageCount} photo(s) and ${videoCount} video(s)`
        : videoCount > 0 ? `${videoCount} video(s)` : `${imageCount} photo(s)`;

      try {
        const processingToast = toast.loading(`Processing ${fileTypes} (${totalFileSizeMB.toFixed(2)}MB)...`);
        mediaUrls = await convertFilesToDataUrls(mediaFiles);
        toast.dismiss(processingToast);

        const totalBase64SizeMB = mediaUrls.reduce((sum, url) => sum + url.length, 0) / 1024 / 1024;
        if (totalBase64SizeMB > 45) {
          toast.error(`Converted files are too large (${totalBase64SizeMB.toFixed(2)}MB).`);
          isSubmittingRef.current = false;
          return;
        }
        toast.success(`Processed ${fileTypes} successfully`);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to process photos/videos.');
        isSubmittingRef.current = false;
        return;
      }
    }

    reportMutation.mutate({
      truckId: finalTruckId,
      breakdownType: 'OTHER' as const,
      priority: 'MEDIUM' as const,
      location: finalLocation,
      address: loc.address || undefined,
      city: loc.city || undefined,
      state: loc.state || undefined,
      zip: loc.zip || undefined,
      latitude: loc.latitude,
      longitude: loc.longitude,
      description,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    }, {
      onSettled: () => { isSubmittingRef.current = false; },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-filled Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-dashed">
            <p className="text-xs font-medium text-muted-foreground mb-2">Auto-filled Information</p>

            {/* Truck Info */}
            <TruckSelector
              currentTruckData={currentTruckData}
              trucks={trucks}
              truckId={truckId}
              setTruckId={setTruckId}
            />

            {/* Location Info */}
            <LocationDisplay
              location={loc.location}
              latitude={loc.latitude}
              longitude={loc.longitude}
              locationLoading={loc.locationLoading}
              onGetLocation={loc.getCurrentLocation}
              onLocationChange={loc.setLocation}
            />

            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              Fleet department will review and update breakdown type, priority, and other details.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">What happened? *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the breakdown issue in detail..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Please provide as much detail as possible about the issue
            </p>
          </div>

          {/* Photo Upload */}
          <MediaUploadSection
            mediaFiles={mediaFiles}
            mediaPreviews={mediaPreviews}
            onFilesChange={setMediaFiles}
            onPreviewsChange={setMediaPreviews}
          />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={reportMutation.isPending || !description.trim() || !truckId}
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mediaFiles.length > 0 ? 'Processing and submitting...' : 'Submitting...'}
              </>
            ) : (
              <><Send className="h-4 w-4 mr-2" />Report Breakdown</>
            )}
          </Button>
          {!truckId && !currentTruckData?.data?.truck && trucks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-2">Loading truck information...</p>
          )}
          {!truckId && !currentTruckData?.data?.truck && trucks.length > 0 && (
            <p className="text-sm text-destructive text-center mt-2">Please select a truck to continue</p>
          )}
          {reportMutation.isError && (
            <p className="text-sm text-destructive text-center mt-2">
              Failed to submit. Please check your connection and try again.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

/* --- Inline helper components --- */

function TruckSelector({ currentTruckData, trucks, truckId, setTruckId }: {
  currentTruckData: any; trucks: TruckOption[]; truckId: string; setTruckId: (v: string) => void;
}) {
  if (currentTruckData?.data?.truck) {
    return (
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Truck:</span>
          <span className="font-medium">#{currentTruckData.data.truck.truckNumber}</span>
        </div>
        {trucks.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setTruckId('')} className="text-xs h-6">Change</Button>
        )}
      </div>
    );
  }

  if (trucks.length > 0) {
    return (
      <div className="space-y-1">
        <Label htmlFor="truck-select" className="text-xs font-medium">Select Truck *</Label>
        <Select value={truckId} onValueChange={setTruckId} required>
          <SelectTrigger id="truck-select" className="h-8 text-sm"><SelectValue placeholder="Choose your truck" /></SelectTrigger>
          <SelectContent>
            {trucks.map((truck) => (
              <SelectItem key={truck.id} value={truck.id}>Truck #{truck.truckNumber}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-orange-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Loading truck information...</span>
    </div>
  );
}

function LocationDisplay({ location, latitude, longitude, locationLoading, onGetLocation, onLocationChange }: {
  location: string; latitude?: number; longitude?: number; locationLoading: boolean;
  onGetLocation: () => void; onLocationChange: (v: string) => void;
}) {
  if (location) {
    return (
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <span className="text-muted-foreground">Location: </span>
          <span className="font-medium">{location}</span>
          {latitude && longitude && (
            <p className="text-xs text-muted-foreground mt-0.5">GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onGetLocation} title="Refresh location" disabled={locationLoading}>
          {locationLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {locationLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /><span>Getting your location...</span>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Location not captured</div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onGetLocation} disabled={locationLoading} className="text-xs">
          {locationLoading ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Getting...</>
          ) : (
            <><MapPin className="h-3 w-3 mr-1" />Get Location</>
          )}
        </Button>
        <Input
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Or enter location manually (e.g., I-80, Mile 145)"
          className="text-sm h-8"
        />
      </div>
    </div>
  );
}
