'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Camera, MapPin, Send, Loader2, X, Image as ImageIcon, Truck } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface Truck {
  id: string;
  truckNumber: string;
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?status=IN_USE&limit=100'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

async function fetchCurrentTruck() {
  const response = await fetch(apiUrl('/api/mobile/driver/current-truck'));
  if (!response.ok) throw new Error('Failed to fetch current truck');
  return response.json();
}

async function reportBreakdown(data: any) {
  try {
    // Log request size for debugging
    const requestBody = JSON.stringify(data);
    const requestSize = new Blob([requestBody]).size;
    const requestSizeMB = requestSize / 1024 / 1024;
    console.log(`Request size: ${requestSizeMB.toFixed(2)}MB`);
    
    if (requestSize > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Request is too large. Please reduce the number or size of photos.');
    }

    const response = await fetch(apiUrl('/api/mobile/breakdowns'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });
    
    if (!response.ok) {
      // Try to get error message, but handle cases where response is too large or malformed
      let errorMessage = `Failed to report breakdown (${response.status})`;
      try {
        const text = await response.text();
        if (text) {
          try {
            const error = JSON.parse(text);
            errorMessage = error.error?.message || error.message || errorMessage;
          } catch (parseError) {
            // If JSON parsing fails, check if it's a truncated response
            if (text.length > 10000) {
              errorMessage = `Server error: Response too large to parse. The request may have exceeded server limits.`;
            } else {
              errorMessage = `Server error: ${text.substring(0, 200)}`;
            }
          }
        }
      } catch (textError) {
        console.error('Error reading response:', textError);
        errorMessage = `Failed to read server response (${response.status})`;
      }
      
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        requestSizeMB: requestSizeMB.toFixed(2),
      });
      
      throw new Error(errorMessage);
    }
    
    // Parse response, handle large responses
    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response JSON:', parseError);
      throw new Error('Invalid response from server. Please try again.');
    }
  } catch (error) {
    console.error('Error in reportBreakdown:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while reporting breakdown');
  }
}

export default function BreakdownReportForm() {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const [truckId, setTruckId] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [zip, setZip] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  // Fetch current truck
  const { data: currentTruckData } = useQuery({
    queryKey: ['driver-current-truck'],
    queryFn: fetchCurrentTruck,
  });

  const { data: trucksData } = useQuery({
    queryKey: ['driver-trucks'],
    queryFn: fetchTrucks,
  });

  const trucks: Truck[] = trucksData?.data?.trucks || trucksData?.data || [];

  // Auto-set truck when current truck is loaded
  useEffect(() => {
    if (currentTruckData?.data?.truck?.id) {
      const truckIdFromData = currentTruckData.data.truck.id;
      if (!truckId || truckId !== truckIdFromData) {
        console.log('Auto-setting truck ID:', truckIdFromData);
        setTruckId(truckIdFromData);
      }
    }
  }, [currentTruckData?.data?.truck?.id, truckId]);

  // Auto-get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const reportMutation = useMutation({
    mutationFn: reportBreakdown,
    onSuccess: (data) => {
      console.log('Breakdown report successful:', data);
      isSubmittingRef.current = false;
      toast.success(`Breakdown case ${data.data.breakdown.breakdownNumber} created!`);
      router.push(`/mobile/driver/breakdowns/${data.data.breakdown.id}`);
    },
    onError: (error: Error) => {
      console.error('Breakdown report error:', error);
      isSubmittingRef.current = false;
      toast.error(error.message || 'Failed to report breakdown');
    },
  });

  const reverseGeocode = async (lat: number, lng: number): Promise<void> => {
    // Set coordinates immediately as fallback
    const coordLocation = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setLocation(coordLocation);
    
    // Try reverse geocoding via our API to avoid CORS issues
    try {
      const response = await fetch(
        apiUrl(`/api/geocoding/reverse?lat=${lat}&lon=${lng}`)
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};

        // Update location fields
        if (address.road) {
          setAddress(`${address.house_number || ''} ${address.road}`.trim());
        }
        if (address.city || address.town || address.village) {
          setCity(address.city || address.town || address.village);
        }
        if (address.state) {
          setState(address.state);
        }
        if (address.postcode) {
          setZip(address.postcode);
        }

        // Create a readable location string
        const locationParts = [];
        if (address.road) locationParts.push(address.road);
        if (address.city || address.town || address.village) {
          locationParts.push(address.city || address.town || address.village);
        }
        if (address.state) locationParts.push(address.state);
        
        if (locationParts.length > 0) {
          setLocation(locationParts.join(', '));
        }
      }
    } catch (error) {
      console.warn('Reverse geocoding failed, using coordinates:', error);
      // Already set coordinates above, so just continue
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    
    // Set a timeout to stop loading after 15 seconds
    const timeoutId = setTimeout(() => {
      if (locationLoading) {
        setLocationLoading(false);
        toast.error('Location request is taking too long. You can enter location manually.');
      }
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode to get address
        await reverseGeocode(lat, lng);
        
        toast.success('Location captured automatically');
        setLocationLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. You can enter location manually below.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. You can enter location manually below.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. You can enter location manually below.';
            break;
        }
        toast.error(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 8000, // Reduced timeout to 8 seconds
        maximumAge: 60000, // Accept cached location up to 1 minute old
      }
    );
  };

  const handleGetLocation = () => {
    getCurrentLocation();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalFiles = mediaFiles.length + newFiles.length;
    
    if (totalFiles > 10) {
      toast.error('Maximum 10 photos/videos allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const previewPromises: Promise<string>[] = [];

    newFiles.forEach((file) => {
      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video file`);
        return;
      }

      // Check file size (max 50MB for videos, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is ${isVideo ? '50MB' : '10MB'}`);
        return;
      }

      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`Adding file: ${file.name}, type: ${file.type}, size: ${fileSizeMB}MB, isVideo: ${isVideo}, isImage: ${isImage}`);
      validFiles.push(file);

      // Create preview promise
      const previewPromise = new Promise<string>((resolve, reject) => {
        // For videos, use a simple placeholder (thumbnail generation can be slow/unreliable)
        if (file.type.startsWith('video/')) {
          // Immediately resolve with placeholder - video will still be attached
          resolve('data:video/placeholder');
        } else {
          // For images, read as data URL
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      });
      previewPromises.push(previewPromise);
    });

    // Add files immediately, then update previews when ready
    setMediaFiles((prev) => [...prev, ...validFiles]);
    
    // Wait for all previews to load, then update state
    if (previewPromises.length > 0) {
      Promise.allSettled(previewPromises)
        .then((results) => {
          const previews: string[] = [];
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              previews.push(result.value);
            } else {
              console.warn(`Preview failed for file ${index}:`, result.reason);
              // Use placeholder for failed previews
              previews.push('data:video/placeholder');
            }
          });
          setMediaPreviews((prev) => [...prev, ...previews]);
          toast.success(`Added ${validFiles.length} file(s)`);
        })
        .catch((error) => {
          console.error('Error creating previews:', error);
          // Add placeholder previews for all files
          setMediaPreviews((prev) => [...prev, ...Array(validFiles.length).fill('data:video/placeholder')]);
          toast.success(`Added ${validFiles.length} file(s) (some previews failed)`);
        });
    } else {
      toast.success(`Added ${validFiles.length} file(s)`);
    }
    
    // Reset file input
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const convertFilesToDataUrls = async (files: File[]): Promise<string[]> => {
    console.log(`Starting conversion of ${files.length} file(s) to base64...`);
    
    const promises = files.map((file, index) => {
      return new Promise<string>((resolve, reject) => {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        
        console.log(`Converting file ${index + 1}/${files.length}: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // For large files, increase timeout (videos can take longer)
        const timeoutDuration = isVideo ? 60000 : 30000; // 60s for videos, 30s for images
        const timeoutId = setTimeout(() => {
          reject(new Error(`File ${file.name} took too long to process (${timeoutDuration/1000}s timeout)`));
        }, timeoutDuration);

        const reader = new FileReader();
        
        reader.onloadstart = () => {
          console.log(`Started reading file: ${file.name}`);
        };
        
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            if (percent % 25 === 0) { // Log every 25%
              console.log(`Reading ${file.name}: ${percent}%`);
            }
          }
        };
        
        reader.onload = (e) => {
          clearTimeout(timeoutId);
          const result = e.target?.result as string;
          if (!result) {
            reject(new Error(`Failed to read file ${file.name} - no result`));
            return;
          }
          
          const base64Size = result.length;
          const base64SizeMB = base64Size / 1024 / 1024;
          
          console.log(`Successfully converted ${file.name}: ${base64SizeMB.toFixed(2)}MB base64`);
          
          // Warn if file is very large but still allow it
          if (base64SizeMB > 10) {
            console.warn(`File ${file.name} is very large (${base64SizeMB.toFixed(2)}MB base64). This may cause issues.`);
          }
          
          resolve(result);
        };
        
        reader.onerror = (error) => {
          clearTimeout(timeoutId);
          console.error(`Error reading file ${file.name}:`, error);
          reject(new Error(`Error reading file ${file.name}: ${error}`));
        };
        
        reader.onabort = () => {
          clearTimeout(timeoutId);
          console.error(`File ${file.name} read was aborted`);
          reject(new Error(`File ${file.name} read was aborted`));
        };
        
        // Start reading the file
        try {
          reader.readAsDataURL(file);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`Exception starting file read for ${file.name}:`, error);
          reject(new Error(`Failed to start reading file ${file.name}: ${error}`));
        }
      });
    });
    
    try {
      const results = await Promise.all(promises);
      const totalSize = results.reduce((sum, r) => sum + r.length, 0);
      console.log(`Successfully converted ${results.length} files to data URLs. Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      return results;
    } catch (error) {
      console.error('Error converting files:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission using ref
    if (isSubmittingRef.current || reportMutation.isPending) {
      console.log('Already submitting, ignoring...');
      return;
    }
    
    console.log('Form submitted!', { 
      description: description.trim(), 
      truckId, 
      currentTruckData: currentTruckData?.data?.truck?.id,
      mediaFilesCount: mediaFiles.length 
    });
    
    isSubmittingRef.current = true;
    
    // Only require description (photos are optional but recommended)
    if (!description.trim()) {
      toast.error('Please describe the breakdown issue');
      return;
    }

    // Truck is required - check if we have truck data but truckId not set yet
    let finalTruckId = truckId || currentTruckData?.data?.truck?.id;
    
    if (!finalTruckId) {
      console.error('No truck ID available:', { 
        truckId, 
        currentTruckData,
        trucksAvailable: trucks.length 
      });
      isSubmittingRef.current = false;
      toast.error('Please select a truck to report the breakdown for.');
      return;
    }
    
    // Ensure truckId state is set
    if (truckId !== finalTruckId) {
      setTruckId(finalTruckId);
    }
    
    console.log('Final truck ID:', finalTruckId);

    // Location is optional - use "Location not available" if not captured
    const finalLocation = location || 'Location not available - please update';

    // Convert files to data URLs
    let mediaUrls: string[] = [];
    if (mediaFiles.length > 0) {
      const videoCount = mediaFiles.filter(f => f.type.startsWith('video/')).length;
      const imageCount = mediaFiles.filter(f => f.type.startsWith('image/')).length;
      const fileTypes = videoCount > 0 && imageCount > 0 
        ? `${imageCount} photo(s) and ${videoCount} video(s)`
        : videoCount > 0
        ? `${videoCount} video(s)`
        : `${imageCount} photo(s)`;
      
      // Check total file size before conversion
      const totalFileSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);
      const totalFileSizeMB = totalFileSize / 1024 / 1024;
      
      if (totalFileSizeMB > 40) {
        toast.error(`Total file size (${totalFileSizeMB.toFixed(2)}MB) exceeds 40MB limit. Please reduce the number or size of files.`);
        isSubmittingRef.current = false;
        return;
      }
      
      try {
        const processingToast = toast.loading(`Processing ${fileTypes} (${totalFileSizeMB.toFixed(2)}MB)...`);
        console.log('Starting file conversion for', mediaFiles.length, 'files:', mediaFiles.map(f => ({ name: f.name, type: f.type, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` })));
        mediaUrls = await convertFilesToDataUrls(mediaFiles);
        toast.dismiss(processingToast);
        
        // Check converted size (base64 is ~33% larger)
        const totalBase64Size = mediaUrls.reduce((sum, url) => sum + url.length, 0);
        const totalBase64SizeMB = totalBase64Size / 1024 / 1024;
        console.log(`Converted ${mediaFiles.length} files. Total base64 size: ${totalBase64SizeMB.toFixed(2)}MB`);
        
        if (totalBase64SizeMB > 45) {
          toast.error(`Converted files are too large (${totalBase64SizeMB.toFixed(2)}MB). Please reduce the number or size of files.`);
          isSubmittingRef.current = false;
          return;
        }
        
        if (mediaUrls.length > 0) {
          toast.success(`Processed ${fileTypes} successfully (${totalBase64SizeMB.toFixed(2)}MB)`);
        }
      } catch (error: any) {
        console.error('Error converting files:', error);
        toast.error(error?.message || 'Failed to process photos/videos. Please try again or submit without photos.');
        isSubmittingRef.current = false;
        return;
      }
    } else {
      console.log('No files to convert');
    }

    // Auto-set defaults: breakdownType = OTHER, priority = MEDIUM
    const payload = {
      truckId: finalTruckId,
      breakdownType: 'OTHER' as const,
      priority: 'MEDIUM' as const,
      location: finalLocation,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      latitude: latitude,
      longitude: longitude,
      description,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    };
    
    console.log('Submitting breakdown report...', {
      truckId: finalTruckId,
      location: finalLocation,
      description: description.substring(0, 50) + '...',
      mediaCount: mediaUrls.length,
      hasMedia: mediaUrls.length > 0,
    });
    
    reportMutation.mutate(payload, {
      onSettled: () => {
        isSubmittingRef.current = false;
      },
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
            <div className="space-y-2">
              {currentTruckData?.data?.truck ? (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Truck:</span>
                    <span className="font-medium">#{currentTruckData.data.truck.truckNumber}</span>
                  </div>
                  {trucks.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTruckId('')}
                      className="text-xs h-6"
                    >
                      Change
                    </Button>
                  )}
                </div>
              ) : trucks.length > 0 ? (
                <div className="space-y-1">
                  <Label htmlFor="truck-select" className="text-xs font-medium">
                    Select Truck *
                  </Label>
                  <Select value={truckId} onValueChange={setTruckId} required>
                    <SelectTrigger id="truck-select" className="h-8 text-sm">
                      <SelectValue placeholder="Choose your truck" />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.map((truck: Truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          Truck #{truck.truckNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading truck information...</span>
                </div>
              )}
            </div>
            
            {/* Location Info */}
            <div className="space-y-2">
              {location ? (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-muted-foreground">Location: </span>
                    <span className="font-medium">{location}</span>
                    {latitude && longitude && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleGetLocation}
                    title="Refresh location"
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {locationLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Getting your location...</span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Location not captured
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="text-xs"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Getting...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3 mr-1" />
                          Get Location
                        </>
                      )}
                    </Button>
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Or enter location manually (e.g., I-80, Mile 145)"
                      className="text-sm h-8"
                    />
                  </div>
                </div>
              )}
            </div>
            
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
          <div className="space-y-2">
            <Label>Photos/Videos (Recommended)</Label>
            <div className="space-y-2">
              <input
                type="file"
                id="media-upload"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <label htmlFor="media-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  asChild
                >
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photos/Videos ({mediaFiles.length}/10)
                  </span>
                </Button>
              </label>
              
              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                        {preview.startsWith('data:image/') && !preview.startsWith('data:video/placeholder') ? (
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-2">
                            {mediaFiles[index]?.type.startsWith('video/') ? (
                              <>
                                <div className="relative">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">
                                    ▶
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-1">
                                  {mediaFiles[index]?.name || 'Video'}
                                </p>
                              </>
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {mediaFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>

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
              <>
                <Send className="h-4 w-4 mr-2" />
                Report Breakdown
              </>
            )}
          </Button>
          {!truckId && !currentTruckData?.data?.truck && trucks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Loading truck information...
            </p>
          )}
          {!truckId && !currentTruckData?.data?.truck && trucks.length > 0 && (
            <p className="text-sm text-destructive text-center mt-2">
              Please select a truck to continue
            </p>
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

