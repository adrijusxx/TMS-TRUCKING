/** Shared Mattermost types used across components */

export interface MattermostChannel {
  id: string;
  name: string;
  displayName: string;
  type: 'O' | 'P' | 'D' | 'G'; // Open, Private, Direct, Group
  purpose: string;
  header: string;
  lastPostAt: number;
  totalMsgCount: number;
  unreadCount: number;
  teamId: string;
}

export interface MattermostUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  roles: string;
  isBot: boolean;
}

export interface MattermostPost {
  id: string;
  channelId: string;
  userId: string;
  message: string;
  createAt: number;
  updateAt: number;
  type: string;
  props: Record<string, any>;
  fileIds: string[];
  hasReactions: boolean;
  rootId: string;
  /** Populated after fetch */
  senderName?: string;
  isBot?: boolean;
}

export interface MattermostFile {
  id: string;
  userId: string;
  postId: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  hasPreviewImage: boolean;
}

export interface MattermostDialog {
  id: string;
  title: string;
  displayName: string;
  type: 'channel' | 'direct' | 'group';
  unreadCount: number;
  lastMessage: string;
  lastMessageDate: string | null;
  username?: string;
  aiAutoReply?: boolean;
}

export interface MattermostMessage {
  id: string;
  text: string;
  date: string | null;
  out: boolean;
  senderId: string;
  senderName?: string;
  replyToId: string | null;
  files: MattermostFile[];
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
  channelId: string;
  channelName?: string;
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
  counts: {
    pending: number;
    approved: number;
    dismissed: number;
    caseApproval: number;
    driverLinkNeeded: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Helpers */
export function getDisplayName(dialog: MattermostDialog): string {
  return dialog.displayName || dialog.title;
}

export function getSubtitle(dialog: MattermostDialog): string | null {
  if (dialog.username) return `@${dialog.username}`;
  return null;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
