/**
 * Geo-Tagged Photo Capture
 *
 * Camera button that captures a photo and automatically attaches
 * the device's GPS coordinates. Shows a location accuracy indicator
 * and attaches coordinates to the upload FormData.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Camera,
  MapPin,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  getCurrentPosition,
  tagPhotoWithLocation,
  getAccuracyLabel,
  getAccuracyColor,
  type GeoCoordinates,
  type GeoTaggedFile,
} from '@/lib/mobile/geo-tag';

interface GeoTaggedPhotoCaptureProps {
  /** Called when a geo-tagged photo is captured. */
  onCapture: (tagged: GeoTaggedFile) => void;
  /** Optional label for the button. */
  label?: string;
  /** Whether the component is disabled. */
  disabled?: boolean;
}

type LocationState = 'idle' | 'acquiring' | 'acquired' | 'error';

export default function GeoTaggedPhotoCapture({
  onCapture,
  label = 'Capture Photo with Location',
  disabled = false,
}: GeoTaggedPhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const acquireLocation = useCallback(async (): Promise<GeoCoordinates | null> => {
    setLocationState('acquiring');
    setLocationError(null);

    try {
      const position = await getCurrentPosition();
      setCoords(position);
      setLocationState('acquired');
      return position;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setLocationError(message);
      setLocationState('error');
      return null;
    }
  }, []);

  const handleCaptureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Generate preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      pendingFileRef.current = file;

      // Acquire GPS in parallel
      const position = await acquireLocation();

      if (position) {
        const tagged = tagPhotoWithLocation(file, position);
        onCapture(tagged);
      } else {
        // Still provide the photo without coords so the user isn't blocked
        const fallbackCoords: GeoCoordinates = {
          latitude: 0,
          longitude: 0,
          accuracy: -1,
          altitude: null,
          timestamp: Date.now(),
        };
        onCapture(tagPhotoWithLocation(file, fallbackCoords));
      }
    },
    [acquireLocation, onCapture],
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setCoords(null);
    setLocationState('idle');
    setLocationError(null);
    pendingFileRef.current = null;
  }, []);

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview && (
        <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
          <img
            src={preview}
            alt="Captured photo"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Location overlay */}
          {coords && coords.accuracy > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              <MapPin className={`h-3.5 w-3.5 ${getAccuracyColor(coords.accuracy)}`} />
              <span>{getAccuracyLabel(coords.accuracy)} accuracy</span>
              <span className="text-white/60">
                ({Math.round(coords.accuracy)}m)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Capture Button */}
      {!preview && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full h-14 border-dashed text-base"
          onClick={handleCaptureClick}
          disabled={disabled || locationState === 'acquiring'}
        >
          {locationState === 'acquiring' ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              {label}
            </>
          )}
        </Button>
      )}

      {/* Location Status */}
      {locationState === 'acquired' && coords && coords.accuracy > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className={getAccuracyColor(coords.accuracy)}>
            GPS: {getAccuracyLabel(coords.accuracy)} accuracy ({Math.round(coords.accuracy)}m)
          </span>
        </div>
      )}

      {locationState === 'error' && locationError && (
        <div className="flex items-center gap-2 text-sm text-yellow-600">
          <AlertTriangle className="h-4 w-4" />
          <span>{locationError}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
