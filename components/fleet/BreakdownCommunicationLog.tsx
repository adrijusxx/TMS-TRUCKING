'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  MessageSquare,
  Mail,
  Plus,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Paperclip,
} from 'lucide-react';
import { formatDateTime, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface CommunicationLog {
  id: string;
  channel: 'SIP' | 'SMS' | 'TELEGRAM' | 'EMAIL' | 'MOBILE_APP';
  type: 'CALL' | 'SMS' | 'MMS' | 'TELEGRAM' | 'EMAIL' | 'VOICEMAIL' | 'NOTE' | 'MESSAGE' | 'BREAKDOWN_REPORT';
  direction: 'INBOUND' | 'OUTBOUND';
  content: string | null;
  duration?: number | null;
  from?: string | null;
  to?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  telegramId?: string | null;
  telegramChatId?: string | null;
  emailAddress?: string | null;
  mediaUrls?: string[];
  location?: { latitude: number; longitude: number } | { lat: number; lng: number; address?: string } | null;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING';
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  } | null;
  user?: {
    firstName: string;
    lastName: string;
  } | null;
  driver?: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface BreakdownCommunicationLogProps {
  breakdownId: string;
}

async function fetchCommunications(breakdownId: string) {
  const response = await fetch(apiUrl(`/api/fleet/breakdowns/${breakdownId}/communications`));
  if (!response.ok) throw new Error('Failed to fetch communications');
  return response.json();
}

async function convertFilesToDataUrls(files: File[]): Promise<string[]> {
  const promises = files.map((file) => {
    return new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`File ${file.name} took too long to process`));
      }, 30000);

      const reader = new FileReader();
      reader.onload = (e) => {
        clearTimeout(timeoutId);
        const result = e.target?.result as string;
        if (!result) {
          reject(new Error(`Failed to read file ${file.name}`));
          return;
        }
        resolve(result);
      };
      reader.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Error reading file ${file.name}: ${error}`));
      };
      reader.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error(`File ${file.name} read was aborted`));
      };
      reader.readAsDataURL(file);
    });
  });

  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error converting files:', error);
    throw error;
  }
}

async function createCommunication(breakdownId: string, data: {
  channel: string;
  type: string;
  direction: string;
  content?: string;
  duration?: number;
  fromNumber?: string;
  toNumber?: string;
  telegramId?: string;
  telegramChatId?: string;
  mediaUrls?: string[];
}) {
  const response = await fetch(apiUrl(`/api/fleet/breakdowns/${breakdownId}/communications`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create communication');
  }
  return response.json();
}

export default function BreakdownCommunicationLog({ breakdownId }: BreakdownCommunicationLogProps) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [communicationChannel, setCommunicationChannel] = useState<string>('TELEGRAM');
  const [communicationType, setCommunicationType] = useState<string>('TELEGRAM');
  const [communicationDirection, setCommunicationDirection] = useState<string>('OUTBOUND');
  const [communicationContent, setCommunicationContent] = useState('');
  const [duration, setDuration] = useState<string>('');
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['breakdownCommunications', breakdownId],
    queryFn: () => fetchCommunications(breakdownId),
  });

  const communications: CommunicationLog[] = data?.data?.communications || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert files to base64 if any
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        const processingToast = toast.loading(`Processing ${mediaFiles.length} file(s)...`);
        try {
          mediaUrls = await convertFilesToDataUrls(mediaFiles);
          toast.dismiss(processingToast);
          toast.success(`Processed ${mediaUrls.length} file(s)`);
        } catch (error: any) {
          toast.dismiss(processingToast);
          throw new Error(error?.message || 'Failed to process attachments');
        }
      }
      return createCommunication(breakdownId, { ...data, mediaUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdownCommunications', breakdownId] });
      queryClient.invalidateQueries({ queryKey: ['fleetCommunications'] }); // Also refresh communication hub
      toast.success('Communication logged successfully');
      setLogDialogOpen(false);
      setCommunicationContent('');
      setDuration('');
      setMediaFiles([]);
      setMediaPreviews([]);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalFiles = mediaFiles.length + newFiles.length;

    if (totalFiles > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }

    const validFiles: File[] = [];
    const previewPromises: Promise<string>[] = [];

    newFiles.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo && !file.type.startsWith('application/') && !file.type.startsWith('text/')) {
        toast.error(`${file.name} is not a supported file type`);
        return;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is ${isVideo ? '50MB' : '10MB'}`);
        return;
      }

      validFiles.push(file);

      // Create preview for images only
      if (isImage) {
        const previewPromise = new Promise<string>((resolve, reject) => {
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
        });
        previewPromises.push(previewPromise);
      } else {
        previewPromises.push(Promise.resolve('data:file/placeholder'));
      }
    });

    setMediaFiles((prev) => [...prev, ...validFiles]);

    if (previewPromises.length > 0) {
      Promise.allSettled(previewPromises).then((results) => {
        const previews: string[] = [];
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            previews.push(result.value);
          } else {
            previews.push('data:file/placeholder');
          }
        });
        setMediaPreviews((prev) => [...prev, ...previews]);
      });
    }

    if (e.target) {
      (e.target as HTMLInputElement).value = '';
    }
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleSubmit = () => {
    if (!communicationContent.trim() && mediaFiles.length === 0) {
      toast.error('Please enter communication content or attach a file');
      return;
    }

    createMutation.mutate({
      channel: communicationChannel,
      type: communicationType,
      direction: communicationDirection,
      content: communicationContent || undefined,
      duration: communicationType === 'CALL' && duration ? parseInt(duration) : undefined,
      telegramChatId: communicationChannel === 'TELEGRAM' && telegramChatId ? telegramChatId : undefined,
    });
  };

  const getCommunicationIcon = (type: string, channel: string) => {
    if (channel === 'MOBILE_APP') {
      return <MessageSquare className="h-4 w-4" />;
    }
    switch (type) {
      case 'CALL':
      case 'VOICEMAIL':
        return <Phone className="h-4 w-4" />;
      case 'SMS':
      case 'MMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'TELEGRAM':
        return <MessageSquare className="h-4 w-4" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'NOTE':
        return <FileText className="h-4 w-4" />;
      case 'BREAKDOWN_REPORT':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCommunicationColor = (type: string, channel: string) => {
    if (channel === 'MOBILE_APP') {
      return type === 'BREAKDOWN_REPORT' ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white';
    }
    switch (type) {
      case 'CALL':
      case 'VOICEMAIL':
        return 'bg-blue-500 text-white';
      case 'SMS':
      case 'MMS':
        return 'bg-green-500 text-white';
      case 'TELEGRAM':
        return 'bg-cyan-500 text-white';
      case 'EMAIL':
        return 'bg-purple-500 text-white';
      case 'NOTE':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Communication Timeline</CardTitle>
            <CardDescription>All calls, texts, emails, and notes</CardDescription>
          </div>
          <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Communication
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Communication</DialogTitle>
                <DialogDescription>
                  Record a call, text, email, or note for this breakdown
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={communicationChannel} onValueChange={(value) => {
                    setCommunicationChannel(value);
                    // Auto-set type based on channel
                    if (value === 'TELEGRAM') setCommunicationType('TELEGRAM');
                    else if (value === 'SMS') setCommunicationType('SMS');
                    else if (value === 'SIP') setCommunicationType('CALL');
                    else if (value === 'EMAIL') setCommunicationType('EMAIL');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOBILE_APP">Driver App</SelectItem>
                      <SelectItem value="TELEGRAM">Telegram</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="SIP">Phone Call (SIP)</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={communicationType} onValueChange={setCommunicationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {communicationChannel === 'SIP' && (
                        <>
                          <SelectItem value="CALL">Phone Call</SelectItem>
                          <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
                        </>
                      )}
                      {communicationChannel === 'SMS' && (
                        <>
                          <SelectItem value="SMS">Text Message</SelectItem>
                          <SelectItem value="MMS">Multimedia Message</SelectItem>
                        </>
                      )}
                      {communicationChannel === 'TELEGRAM' && (
                        <SelectItem value="TELEGRAM">Telegram Message</SelectItem>
                      )}
                      {communicationChannel === 'EMAIL' && (
                        <SelectItem value="EMAIL">Email</SelectItem>
                      )}
                      {communicationChannel === 'MOBILE_APP' && (
                        <SelectItem value="MESSAGE">Message</SelectItem>
                      )}
                      <SelectItem value="NOTE">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {communicationChannel === 'TELEGRAM' && (
                  <div className="space-y-2">
                    <Label>Telegram Chat ID (optional)</Label>
                    <Input
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g., 123456789 or @username"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select value={communicationDirection} onValueChange={setCommunicationDirection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INBOUND">Inbound</SelectItem>
                      <SelectItem value="OUTBOUND">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {communicationType === 'CALL' && (
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 5"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Content / Notes {mediaFiles.length === 0 && '*'}</Label>
                  <Textarea
                    value={communicationContent}
                    onChange={(e) => setCommunicationContent(e.target.value)}
                    placeholder="Enter communication details, notes, or summary..."
                    rows={5}
                  />
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label>Attachments (Optional)</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="communication-attachments"
                      accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="communication-attachments">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer"
                        asChild
                      >
                        <span>
                          <Paperclip className="h-4 w-4 mr-2" />
                          Add Files ({mediaFiles.length}/10)
                        </span>
                      </Button>
                    </label>

                    {/* Media Previews */}
                    {mediaPreviews.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                              {preview.startsWith('data:image/') ? (
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2">
                                  <FileText className="h-6 w-6 mb-1" />
                                  <span className="text-xs text-center truncate w-full">
                                    {mediaFiles[index]?.name || 'File'}
                                  </span>
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
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLogDialogOpen(false);
                      setCommunicationContent('');
                      setDuration('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Logging...' : 'Log Communication'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading communications...</div>
        ) : communications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No communications logged yet</p>
            <p className="text-sm mt-1">Click "Log Communication" to add the first entry</p>
          </div>
        ) : (
          <div className="space-y-4">
            {communications.map((comm) => (
              <div key={comm.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className={`rounded-full p-2 ${getCommunicationColor(comm.type, comm.channel)}`}>
                  {getCommunicationIcon(comm.type, comm.channel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={getCommunicationColor(comm.type, comm.channel)}>
                      {comm.channel} - {comm.type}
                    </Badge>
                    <Badge variant="outline">
                      {comm.direction}
                    </Badge>
                    {comm.duration && (
                      <span className="text-xs text-muted-foreground">
                        {Math.floor((comm.duration || 0) / 60)}m {((comm.duration || 0) % 60)}s
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDateTime(comm.createdAt)}
                    </span>
                  </div>
                  {comm.content && (
                    <div className="text-sm whitespace-pre-wrap">{comm.content}</div>
                  )}
                  {comm.mediaUrls && comm.mediaUrls.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        {comm.mediaUrls.length} attachment(s):
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {comm.mediaUrls.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square rounded-lg overflow-hidden border bg-muted hover:border-primary transition-colors"
                            >
                              {url.startsWith('data:image/') ? (
                                <img
                                  src={url}
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : url.startsWith('data:video/') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                  <ImageIcon className="h-6 w-6 mb-1" />
                                  <span className="text-xs">Video</span>
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                  <FileText className="h-6 w-6 mb-1" />
                                  <span className="text-xs">File</span>
                                </div>
                              )}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {comm.location && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📍 Location shared
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {comm.createdBy && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {comm.createdBy.firstName} {comm.createdBy.lastName}
                      </div>
                    )}
                    {comm.driver && (
                      <div className="text-xs text-muted-foreground">
                        • Driver: {comm.driver.user.firstName} {comm.driver.user.lastName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

