'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Phone,
  Mail,
  Search,
  Filter,
  AlertTriangle,
  User,
  Truck,
  Clock,
  Send,
  Loader2,
  Camera,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDateTime, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Communication {
  id: string;
  channel: string;
  type: string;
  direction: string;
  content: string | null;
  mediaUrls?: string[];
  createdAt: string;
  driver?: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  createdBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

interface Conversation {
  breakdownId: string | null;
  breakdown: {
    id: string;
    breakdownNumber: string;
    status: string;
    priority: string;
    truck: {
      truckNumber: string;
    };
  } | null;
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  communications: Communication[];
  lastMessageAt: string;
  unreadCount: number;
}

async function fetchCommunications(filters: {
  breakdownId?: string;
  driverId?: string;
  channel?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters.breakdownId) params.append('breakdownId', filters.breakdownId);
  if (filters.driverId) params.append('driverId', filters.driverId);
  if (filters.channel) params.append('channel', filters.channel);
  if (filters.status) params.append('status', filters.status);

  const response = await fetch(apiUrl(`/api/fleet/communications?${params.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch communications');
  return response.json();
}

async function sendMessage(breakdownId: string, content?: string, mediaUrls?: string[]) {
  const response = await fetch(apiUrl(`/api/fleet/breakdowns/${breakdownId}/messages`), {
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

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'MOBILE_APP':
      return <MessageSquare className="h-4 w-4" />;
    case 'TELEGRAM':
      return <MessageSquare className="h-4 w-4" />;
    case 'SMS':
      return <MessageSquare className="h-4 w-4" />;
    case 'SIP':
      return <Phone className="h-4 w-4" />;
    case 'EMAIL':
      return <Mail className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

function getChannelColor(channel: string) {
  switch (channel) {
    case 'MOBILE_APP':
      return 'bg-indigo-500 text-white';
    case 'TELEGRAM':
      return 'bg-cyan-500 text-white';
    case 'SMS':
      return 'bg-green-500 text-white';
    case 'SIP':
      return 'bg-blue-500 text-white';
    case 'EMAIL':
      return 'bg-purple-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export default function CommunicationHub() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['communications', channelFilter],
    queryFn: () => fetchCommunications({ channel: channelFilter === 'all' ? undefined : channelFilter }),
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1, // Only retry once to prevent infinite loops
    retryOnMount: false, // Don't retry on mount if it failed
  });

  const conversations: Conversation[] = data?.data?.conversations || [];

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.breakdown?.breakdownNumber.toLowerCase().includes(query) ||
      conv.driver?.user.firstName.toLowerCase().includes(query) ||
      conv.driver?.user.lastName.toLowerCase().includes(query) ||
      conv.breakdown?.truck.truckNumber.toLowerCase().includes(query)
    );
  });

  const selectedConv = conversations.find(
    (c) => c.breakdownId === selectedConversation
  );

  const sendMutation = useMutation({
    mutationFn: ({ breakdownId, content, mediaUrls }: { breakdownId: string; content?: string; mediaUrls?: string[] }) =>
      sendMessage(breakdownId, content, mediaUrls),
    onSuccess: () => {
      setMessageContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      queryClient.invalidateQueries({ queryKey: ['communications'] });
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

  const handleSendMessage = async () => {
    if (!selectedConv?.breakdownId) {
      toast.error('Please select a conversation');
      return;
    }

    if (!messageContent.trim() && mediaFiles.length === 0) {
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
      breakdownId: selectedConv.breakdownId,
      content: messageContent.trim() || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    });
  };

  // Show error message if query fails
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Failed to load communications. Please refresh the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            All driver communications across breakdown cases
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by case number, driver, or truck..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="MOBILE_APP">Mobile App</SelectItem>
                <SelectItem value="TELEGRAM">Telegram</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="SIP">Phone (SIP)</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations ({filteredConversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-xs mt-1">Communications will appear here when breakdown cases are created and drivers send updates.</p>
              </div>
            ) : (
              <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.breakdownId || `driver-${conv.driver?.id}`}
                    onClick={() => setSelectedConversation(conv.breakdownId || null)}
                    className={`w-full text-left p-4 hover:bg-muted transition-colors ${selectedConversation === conv.breakdownId ? 'bg-muted' : ''
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        {conv.breakdown ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="font-semibold truncate">
                                Case #{conv.breakdown.breakdownNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Truck className="h-3 w-3" />
                              <span>Truck #{conv.breakdown.truck.truckNumber}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-semibold">
                              {conv.driver?.user.firstName} {conv.driver?.user.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={getChannelColor(
                          conv.communications[0]?.channel || 'MOBILE_APP'
                        )}
                      >
                        {conv.communications[0]?.channel.replace('_', ' ')}
                      </Badge>
                    </div>
                    {conv.communications.length > 0 && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {conv.communications[0].content || 'No content'}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(conv.lastMessageAt)}
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="mt-2 bg-primary">
                        {conv.unreadCount} new
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedConv ? (
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedConv.breakdown ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Case #{selectedConv.breakdown.breakdownNumber}
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5" />
                        {selectedConv.driver?.user.firstName}{' '}
                        {selectedConv.driver?.user.lastName}
                      </>
                    )}
                  </CardTitle>
                  {selectedConv.breakdown && (
                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/dashboard/fleet`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Breakdown Case in Dashboard →
                      </Link>
                    </div>
                  )}
                </div>
                {selectedConv.breakdown && (
                  <Badge>{selectedConv.breakdown.status.replace('_', ' ')}</Badge>
                )}
              </div>
            ) : (
              <CardTitle>Select a conversation</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {selectedConv ? (
              <div className="space-y-4">
                {/* Messages */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {selectedConv.communications.map((comm) => (
                    <div
                      key={comm.id}
                      className={`flex ${comm.direction === 'INBOUND' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${comm.direction === 'INBOUND'
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`rounded-full p-1 ${getChannelColor(comm.channel)}`}
                          >
                            {getChannelIcon(comm.channel)}
                          </div>
                          <span className="text-xs opacity-70">
                            {comm.direction === 'INBOUND'
                              ? comm.driver?.user.firstName + ' ' + comm.driver?.user.lastName
                              : comm.createdBy?.firstName + ' ' + comm.createdBy?.lastName}
                          </span>
                          <span className="text-xs opacity-70 ml-auto">
                            {formatDateTime(comm.createdAt)}
                          </span>
                        </div>
                        {comm.content && (
                          <div className="text-sm whitespace-pre-wrap mb-2">{comm.content}</div>
                        )}
                        {comm.mediaUrls && comm.mediaUrls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {comm.mediaUrls.map((url: string, idx: number) => (
                              <div key={idx} className="relative rounded-lg overflow-hidden border bg-background">
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
                        {comm.type === 'BREAKDOWN_REPORT' && (
                          <Badge variant="outline" className="mt-2">
                            Breakdown Report
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Send Message */}
                {selectedConv.breakdown && (
                  <div className="border-t pt-4 space-y-2">
                    {/* Media Previews */}
                    {mediaPreviews.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg overflow-hidden border bg-muted">
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
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="staff-message-media-upload"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="staff-message-media-upload">
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
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type a message..."
                        rows={3}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Message will be sent via Mobile App
                      </span>
                      <Button
                        onClick={handleSendMessage}
                        disabled={sendMutation.isPending || (!messageContent.trim() && mediaFiles.length === 0)}
                      >
                        {sendMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

