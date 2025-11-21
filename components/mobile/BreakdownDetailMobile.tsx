'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Send, AlertTriangle, MapPin, Clock, Truck, Camera, X, Image as ImageIcon } from 'lucide-react';
import { formatDateTime, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface BreakdownDetailMobileProps {
  breakdownId: string;
}

async function fetchBreakdown(id: string) {
  const response = await fetch(apiUrl(`/api/mobile/breakdowns`));
  if (!response.ok) throw new Error('Failed to fetch breakdown');
  const data = await response.json();
  const breakdown = data.data.breakdowns.find((b: any) => b.id === id);
  if (!breakdown) throw new Error('Breakdown not found');
  return breakdown;
}

async function fetchMessages(breakdownId: string) {
  const response = await fetch(apiUrl(`/api/mobile/breakdowns/${breakdownId}/messages`));
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

async function sendMessage(breakdownId: string, content: string, mediaUrls?: string[]) {
  const response = await fetch(apiUrl(`/api/mobile/breakdowns/${breakdownId}/messages`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content: content || undefined,
      mediaUrls: mediaUrls || undefined,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send message');
  }
  return response.json();
}

export default function BreakdownDetailMobile({ breakdownId }: BreakdownDetailMobileProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['breakdown', breakdownId],
    queryFn: () => fetchBreakdown(breakdownId),
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['breakdown-messages', breakdownId],
    queryFn: () => fetchMessages(breakdownId),
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const messages = messagesData?.data?.messages || [];

  const sendMutation = useMutation({
    mutationFn: ({ content, mediaUrls }: { content?: string; mediaUrls?: string[] }) => 
      sendMessage(breakdownId, content || '', mediaUrls),
    onSuccess: () => {
      setMessage('');
      setMediaFiles([]);
      setMediaPreviews([]);
      queryClient.invalidateQueries({ queryKey: ['breakdown-messages', breakdownId] });
      toast.success('Message sent');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalFiles = mediaFiles.length + newFiles.length;
    
    if (totalFiles > 10) {
      toast.error('Maximum 10 photos/videos allowed');
      return;
    }

    const validFiles: File[] = [];
    const previewPromises: Promise<string>[] = [];

    newFiles.forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a valid image or video file`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return;
      }

      validFiles.push(file);

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
    });

    Promise.all(previewPromises)
      .then((previews) => {
        setMediaFiles([...mediaFiles, ...validFiles]);
        setMediaPreviews([...mediaPreviews, ...previews]);
      })
      .catch((error) => {
        console.error('Error creating previews:', error);
        toast.error('Failed to create previews for some files');
        setMediaFiles([...mediaFiles, ...validFiles]);
      });
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const convertFilesToDataUrls = async (files: File[]): Promise<string[]> => {
    const promises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(promises);
  };

  const handleSend = async () => {
    if (!message.trim() && mediaFiles.length === 0) {
      toast.error('Please enter a message or attach a photo');
      return;
    }

    let mediaUrls: string[] = [];
    if (mediaFiles.length > 0) {
      try {
        mediaUrls = await convertFilesToDataUrls(mediaFiles);
      } catch (error) {
        toast.error('Failed to process photos/videos');
        return;
      }
    }

    sendMutation.mutate({ 
      content: message.trim() || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    });
  };

  if (breakdownLoading) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-muted-foreground">Loading breakdown...</div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Breakdown not found</p>
          <Link href="/mobile/driver/breakdowns">
            <Button variant="outline" className="mt-4">
              Back to Breakdowns
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/mobile/driver/breakdowns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Case #{breakdown.breakdownNumber}</h1>
            <p className="text-sm text-muted-foreground">Breakdown Details</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Breakdown Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Breakdown Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge>{breakdown.status.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Priority</span>
              <Badge variant="outline">{breakdown.priority}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Truck #{breakdown.truck.number}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{breakdown.breakdownType.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p>{breakdown.location}</p>
                {breakdown.city && breakdown.state && (
                  <p className="text-muted-foreground">{breakdown.city}, {breakdown.state}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Reported {formatDateTime(breakdown.reportedAt)}
              </span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground">{breakdown.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm mt-1">Start a conversation below</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'INBOUND' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.direction === 'INBOUND'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-xs mb-1 opacity-70">{msg.from}</div>
                      {msg.content && (
                        <div className="text-sm mb-2">{msg.content}</div>
                      )}
                      {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {msg.mediaUrls.map((url: string, idx: number) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border bg-muted">
                              {url.startsWith('data:image/') ? (
                                <img
                                  src={url}
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                              ) : (
                                <div className="w-full h-32 flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs mt-1 opacity-70">
                        {formatDateTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Input (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="p-2 border-b bg-muted/50">
            <div className="flex gap-2 overflow-x-auto">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border bg-background">
                    {preview.startsWith('data:image/') ? (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-5 w-5"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex gap-2">
            <input
              type="file"
              id="message-media-upload"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <label htmlFor="message-media-upload">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Camera className="h-4 w-4" />
                </span>
              </Button>
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              rows={2}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || (!message.trim() && mediaFiles.length === 0)}
              size="icon"
            >
              {sendMutation.isPending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

