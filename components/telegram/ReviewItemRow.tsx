'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
    ClipboardCheck, MessageSquare, AlertTriangle, Wrench,
    ShieldAlert, UserX, Timer, Phone, MapPin, Truck, CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReviewItemActions from './ReviewItemActions';

export interface ReviewItem {
    id: string;
    type: string;
    status: string;
    telegramChatId: string;
    chatTitle?: string;
    senderName?: string;
    messageContent: string;
    messageDate: string;
    aiCategory?: string;
    aiConfidence?: number;
    aiUrgency?: string;
    aiAnalysis?: any;
    driverId?: string;
    driver?: {
        id: string;
        user: { firstName: string; lastName: string; phone?: string };
        currentTruck?: { id: string; truckNumber: string; currentLocation?: string };
    };
    suggestedDriverId?: string;
    suggestedDriver?: {
        id: string;
        user: { firstName: string; lastName: string; phone?: string };
        currentTruck?: { id: string; truckNumber: string };
    };
    matchConfidence?: number;
    matchMethod?: string;
    breakdown?: { id: string; breakdownNumber: string; status: string };
    resolvedBy?: { firstName: string; lastName: string };
    resolvedNote?: string;
    resolvedAt?: string;
    createdAt: string;
}

const URGENCY_BORDER: Record<string, string> = {
    CRITICAL: 'border-l-red-500',
    HIGH: 'border-l-orange-500',
    MEDIUM: 'border-l-yellow-500',
    LOW: 'border-l-blue-500',
};

const CATEGORY_CONFIG: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
    BREAKDOWN: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
    MAINTENANCE: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
    SAFETY: { icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
};

function ExpiryTimer({ createdAt }: { createdAt: string }) {
    const [remaining, setRemaining] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        function update() {
            const expiresAt = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
            const diff = expiresAt - Date.now();
            if (diff <= 0) {
                setRemaining('Expired');
                setIsUrgent(true);
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setRemaining(`${hours}h ${minutes}m`);
            setIsUrgent(hours < 4);
        }
        update();
        const interval = setInterval(update, 60_000);
        return () => clearInterval(interval);
    }, [createdAt]);

    return (
        <span className={`inline-flex items-center gap-1 text-[11px] ${isUrgent ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            <Timer className="h-3 w-3" />
            {remaining}
        </span>
    );
}

export default function ReviewItemRow({ item, isPending, chatNameMap }: { item: ReviewItem; isPending: boolean; chatNameMap: Record<string, string> }) {
    const queryClient = useQueryClient();
    const catConfig = CATEGORY_CONFIG[item.aiCategory || ''];
    const CategoryIcon = catConfig?.icon || MessageSquare;
    const catColor = catConfig?.color || 'text-muted-foreground';
    const catBg = catConfig?.bg || 'bg-muted/50 border-muted-foreground/20';
    const urgencyBorder = URGENCY_BORDER[item.aiUrgency || ''] || 'border-l-muted-foreground/20';
    const displayName = item.senderName || item.chatTitle || chatNameMap[item.telegramChatId] || `Chat ${item.telegramChatId}`;
    const isAutoCreated = item.resolvedNote?.startsWith('Auto-created');

    return (
        <div className={`border-l-4 ${urgencyBorder} pl-3 pr-4 py-3 hover:bg-muted/30 transition-colors`}>
            {/* Header: type badge + sender + driver | time */}
            <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant={item.type === 'DRIVER_LINK_NEEDED' ? 'destructive' : 'default'} className="text-[10px] shrink-0 h-5">
                            {item.type === 'DRIVER_LINK_NEEDED' ? (
                                <><UserX className="h-3 w-3 mr-0.5" /> No Driver</>
                            ) : (
                                <><ClipboardCheck className="h-3 w-3 mr-0.5" /> Needs Approval</>
                            )}
                        </Badge>
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                    </div>
                    {item.driver && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-0.5">
                            <span>{item.driver.user.firstName} {item.driver.user.lastName}</span>
                            {item.driver.user.phone && (
                                <a href={`tel:${item.driver.user.phone}`} className="inline-flex items-center gap-0.5 hover:text-primary">
                                    <Phone className="h-2.5 w-2.5" />
                                    {item.driver.user.phone}
                                </a>
                            )}
                            {item.driver.currentTruck && (
                                <span className="inline-flex items-center gap-0.5">
                                    <Truck className="h-2.5 w-2.5" />
                                    {item.driver.currentTruck.truckNumber}
                                    {item.driver.currentTruck.currentLocation && (
                                        <>
                                            <MapPin className="h-2.5 w-2.5 ml-1" />
                                            <span className="max-w-[200px] truncate">{item.driver.currentTruck.currentLocation}</span>
                                        </>
                                    )}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isPending && <ExpiryTimer createdAt={item.createdAt} />}
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                </div>
            </div>

            {/* Message preview */}
            <p className="text-sm text-foreground line-clamp-2 mb-2">{item.messageContent}</p>

            {/* AI analysis strip */}
            <div className="inline-flex items-center gap-2 flex-wrap bg-muted/40 rounded-md px-2 py-1 mb-2.5">
                <Badge variant="outline" className={`text-xs gap-1 border ${catBg}`}>
                    <CategoryIcon className={`h-3 w-3 ${catColor}`} />
                    <span className={catColor}>{item.aiCategory || 'Unknown'}</span>
                </Badge>
                {item.aiUrgency && (
                    <Badge variant="outline" className={`text-xs border ${
                        item.aiUrgency === 'CRITICAL' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                        item.aiUrgency === 'HIGH' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                        item.aiUrgency === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                        'bg-blue-500/10 text-blue-600 border-blue-500/30'
                    }`}>
                        {item.aiUrgency}
                    </Badge>
                )}
                {item.aiConfidence != null && (
                    <span className="text-xs text-muted-foreground">
                        {Math.round(item.aiConfidence * 100)}% confidence
                    </span>
                )}
            </div>

            {/* Actions or resolution info */}
            {isPending ? (
                <ReviewItemActions
                    item={item}
                    onResolved={() => queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] })}
                />
            ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap bg-muted/20 rounded-md px-2 py-1">
                    {item.status === 'APPROVED' && item.breakdown && (
                        <Badge variant="secondary" className="text-[10px]">
                            Case {item.breakdown.breakdownNumber}
                        </Badge>
                    )}
                    {isAutoCreated && (
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30 gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {item.resolvedNote?.includes('emergency') ? 'Emergency Auto-created' : 'Auto-created'}
                        </Badge>
                    )}
                    {item.resolvedBy && !isAutoCreated && (
                        <span>by {item.resolvedBy.firstName} {item.resolvedBy.lastName}</span>
                    )}
                    {item.resolvedAt && (
                        <span>{formatDistanceToNow(new Date(item.resolvedAt), { addSuffix: true })}</span>
                    )}
                    {item.resolvedNote && !isAutoCreated && (
                        <span className="italic">— {item.resolvedNote}</span>
                    )}
                </div>
            )}
        </div>
    );
}
