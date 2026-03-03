'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploadSectionProps {
  mediaFiles: File[];
  mediaPreviews: string[];
  onFilesChange: (files: File[]) => void;
  onPreviewsChange: (previews: string[]) => void;
}

export default function MediaUploadSection({
  mediaFiles,
  mediaPreviews,
  onFilesChange,
  onPreviewsChange,
}: MediaUploadSectionProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    if (mediaFiles.length + newFiles.length > 10) {
      toast.error('Maximum 10 photos/videos allowed');
      return;
    }

    const validFiles: File[] = [];
    const previewPromises: Promise<string>[] = [];

    newFiles.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video file`);
        return;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is ${isVideo ? '50MB' : '10MB'}`);
        return;
      }

      validFiles.push(file);

      const previewPromise = new Promise<string>((resolve, reject) => {
        if (file.type.startsWith('video/')) {
          resolve('data:video/placeholder');
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            if (result) resolve(result);
            else reject(new Error('Failed to read file'));
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      });
      previewPromises.push(previewPromise);
    });

    onFilesChange([...mediaFiles, ...validFiles]);

    if (previewPromises.length > 0) {
      Promise.allSettled(previewPromises)
        .then((results) => {
          const previews = results.map((r) =>
            r.status === 'fulfilled' ? r.value : 'data:video/placeholder'
          );
          onPreviewsChange([...mediaPreviews, ...previews]);
          toast.success(`Added ${validFiles.length} file(s)`);
        })
        .catch(() => {
          onPreviewsChange([...mediaPreviews, ...Array(validFiles.length).fill('data:video/placeholder')]);
          toast.success(`Added ${validFiles.length} file(s) (some previews failed)`);
        });
    } else {
      toast.success(`Added ${validFiles.length} file(s)`);
    }

    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    onFilesChange(mediaFiles.filter((_, i) => i !== index));
    onPreviewsChange(mediaPreviews.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Photos/Videos (Recommended)</Label>
      <div className="space-y-2">
        <input type="file" id="media-upload" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
        <label htmlFor="media-upload">
          <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
            <span>
              <Camera className="h-4 w-4 mr-2" />
              Add Photos/Videos ({mediaFiles.length}/10)
            </span>
          </Button>
        </label>

        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  {preview.startsWith('data:image/') && !preview.startsWith('data:video/placeholder') ? (
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-2">
                      {mediaFiles[index]?.type.startsWith('video/') ? (
                        <>
                          <div className="relative">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">
                              &#9654;
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
  );
}
