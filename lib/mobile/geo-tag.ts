/**
 * Geo-Tag Module
 *
 * Utilities for capturing the device's GPS coordinates and attaching
 * location metadata to POD photo uploads.
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // metres
  altitude: number | null;
  timestamp: number;
}

export interface GeoTaggedFile {
  file: File;
  coords: GeoCoordinates;
}

/** Accuracy thresholds (metres) used for the UI indicator. */
export const ACCURACY = {
  HIGH: 10,
  MEDIUM: 50,
  LOW: 100,
} as const;

/**
 * Get the device's current GPS position.
 * Returns a promise that resolves with coordinates or rejects with an error.
 */
export function getCurrentPosition(
  options?: PositionOptions,
): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access in your settings.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable. Please try again.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('An unknown location error occurred.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        ...options,
      },
    );
  });
}

/**
 * Attach GPS metadata to a photo file by wrapping it in a GeoTaggedFile.
 * The coordinates are stored alongside the file rather than embedded in EXIF
 * (browser-side EXIF editing is unreliable). The API layer should persist
 * the coords with the document record.
 */
export function tagPhotoWithLocation(
  file: File,
  coords: GeoCoordinates,
): GeoTaggedFile {
  return { file, coords };
}

/**
 * Build FormData with the photo file and GPS coordinates attached.
 * This is the recommended way to send a geo-tagged photo to the server.
 */
export function buildGeoTaggedFormData(
  tagged: GeoTaggedFile,
  loadId: string,
  documentType = 'POD',
): FormData {
  const formData = new FormData();
  formData.append('file', tagged.file);
  formData.append('loadId', loadId);
  formData.append('type', documentType);
  formData.append('title', `${documentType} - ${tagged.file.name}`);
  formData.append('latitude', tagged.coords.latitude.toString());
  formData.append('longitude', tagged.coords.longitude.toString());
  formData.append('accuracy', tagged.coords.accuracy.toString());
  formData.append('timestamp', tagged.coords.timestamp.toString());
  if (tagged.coords.altitude !== null) {
    formData.append('altitude', tagged.coords.altitude.toString());
  }
  return formData;
}

/** Return a human-readable label for the GPS accuracy value. */
export function getAccuracyLabel(accuracy: number): string {
  if (accuracy <= ACCURACY.HIGH) return 'High';
  if (accuracy <= ACCURACY.MEDIUM) return 'Medium';
  if (accuracy <= ACCURACY.LOW) return 'Low';
  return 'Very Low';
}

/** Return a colour class string for the accuracy indicator. */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy <= ACCURACY.HIGH) return 'text-green-600';
  if (accuracy <= ACCURACY.MEDIUM) return 'text-yellow-600';
  if (accuracy <= ACCURACY.LOW) return 'text-orange-600';
  return 'text-red-600';
}
