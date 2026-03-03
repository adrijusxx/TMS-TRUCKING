'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ban, Loader2, Search, Undo2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface IgnoredContact {
    id: string;
    telegramChatId: string;
    senderName?: string;
    reason?: string;
    createdAt: string;
    ignoredBy?: { firstName: string; lastName: string };
}

interface IgnoredData {
    items: IgnoredContact[];
    total: number;
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export default function TelegramIgnoredContacts() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { data, isLoading } = useQuery<IgnoredData>({
        queryKey: ['telegram-ignored-contacts', page, debouncedSearch],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), pageSize: '20' });
            if (debouncedSearch) params.set('search', debouncedSearch);
            const res = await fetch(apiUrl(`/api/telegram/ignored-contacts?${params}`));
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            return json.data;
        },
    });

    const unignoreMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(apiUrl(`/api/telegram/ignored-contacts/${id}`), { method: 'DELETE' });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Contact un-ignored — future messages will be processed');
            queryClient.invalidateQueries({ queryKey: ['telegram-ignored-contacts'] });
            queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const items = data?.items || [];
    const pagination = data?.pagination;

    return (
        <div>
            <div className="px-4 pt-3 pb-2">
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search ignored contacts..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="h-8 pl-8 text-xs"
                    />
                </div>
            </div>

            <ScrollArea className="h-[500px]">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Ban className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No ignored contacts</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map(contact => (
                            <div key={contact.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Ban className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                        <span className="font-medium text-sm truncate">
                                            {contact.senderName || `Chat ${contact.telegramChatId}`}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] shrink-0">
                                            ID: {contact.telegramChatId}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {contact.reason && <span>{contact.reason}</span>}
                                        {contact.ignoredBy && (
                                            <span>by {contact.ignoredBy.firstName} {contact.ignoredBy.lastName}</span>
                                        )}
                                        <span>{formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs shrink-0"
                                    disabled={unignoreMutation.isPending}
                                    onClick={() => unignoreMutation.mutate(contact.id)}
                                >
                                    {unignoreMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <><Undo2 className="h-3 w-3 mr-1" /> Unignore</>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                        {pagination.total} contacts — Page {pagination.page}/{pagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                            disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                            disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
