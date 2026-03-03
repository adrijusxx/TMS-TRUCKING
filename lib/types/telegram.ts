/** Shared Telegram types used across components */

export interface TelegramDialog {
    id: string;
    title: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    phone?: string;
    unreadCount: number;
    lastMessage: string;
    lastMessageDate: string | null;
    isUser: boolean;
    isGroup: boolean;
    isChannel: boolean;
    aiAutoReply?: boolean;
}

export interface TelegramMessage {
    id: number;
    text: string;
    date: string | null;
    out: boolean;
    senderId: string;
    replyToMsgId: number | null;
    media: TelegramMedia | null;
}

export interface TelegramMedia {
    type: string;
    messageId: number;
    chatId: string;
    isPhoto?: boolean;
    photoId?: string;
    isDocument?: boolean;
    fileName?: string;
    mimeType?: string;
    size?: number;
    isVoice?: boolean;
    duration?: number;
}

export interface LinkedCase {
    breakdownNumber: string;
    status: string;
    priority: string;
}

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
    breakdown?: { id: string; breakdownNumber: string; status: string };
    resolvedBy?: { firstName: string; lastName: string };
    resolvedNote?: string;
    resolvedAt?: string;
    createdAt: string;
}

export interface ReviewData {
    items: ReviewItem[];
    counts: { pending: number; approved: number; dismissed: number; caseApproval: number; driverLinkNeeded: number };
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

/** Helpers */
export function getDisplayName(dialog: TelegramDialog): string {
    const parts = [dialog.firstName, dialog.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : dialog.title;
}

export function getSubtitle(dialog: TelegramDialog): string | null {
    const parts: string[] = [];
    if (dialog.username) parts.push(`@${dialog.username}`);
    if (dialog.phone) parts.push(dialog.phone);
    return parts.length > 0 ? parts.join(' · ') : null;
}

export function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
