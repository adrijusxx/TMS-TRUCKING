/**
 * MattermostQueryService
 *
 * Handles read-only operations for Mattermost:
 * - Fetching channels (conversations)
 * - Fetching message history
 * - Downloading files
 * - Retrieving user profiles
 * - Auto-linking drivers by email/name
 */

import { prisma } from '@/lib/prisma';
import { getMattermostService } from './MattermostService';
import type {
  MattermostDialog,
  MattermostMessage,
  MattermostFile,
} from '@/lib/types/mattermost';

export class MattermostQueryService {
  /**
   * Get all channels as dialogs with auto-linking logic
   */
  async getDialogs(teamId: string): Promise<MattermostDialog[]> {
    const service = getMattermostService();
    const channels = await service.getChannels(teamId);

    // Fetch driver mappings
    const mappings = await prisma.mattermostDriverMapping.findMany({
      select: {
        mattermostUserId: true,
        aiAutoReply: true,
      },
    });
    const aiMap = new Map(
      mappings.map((m) => [m.mattermostUserId, m.aiAutoReply]),
    );

    return channels.map((ch: any) => ({
      id: ch.id,
      title: ch.display_name || ch.name,
      displayName: ch.display_name || ch.name,
      type:
        ch.type === 'D'
          ? 'direct'
          : ch.type === 'G'
            ? 'group'
            : 'channel',
      unreadCount: 0, // Would need per-user unread counts from API
      lastMessage: '',
      lastMessageDate: ch.last_post_at
        ? new Date(ch.last_post_at).toISOString()
        : null,
      username: ch.name,
      aiAutoReply: false,
    }));
  }

  /**
   * Get messages from a channel
   */
  async getMessages(
    channelId: string,
    limit = 60,
  ): Promise<MattermostMessage[]> {
    const service = getMattermostService();
    const result = await service.getChannelPosts(
      channelId,
      0,
      limit,
    );

    if (!result?.posts || !result?.order) return [];

    const botUserId = service.getBotUserId();

    // Batch-fetch unique user IDs
    const userIds = [
      ...new Set(
        Object.values(result.posts).map(
          (p: any) => p.user_id as string,
        ),
      ),
    ];
    const userMap = new Map<string, string>();
    for (const uid of userIds) {
      try {
        const user = await service.getUser(uid);
        userMap.set(
          uid,
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
            user.username,
        );
      } catch {
        userMap.set(uid, 'Unknown');
      }
    }

    return result.order.map((postId: string) => {
      const post = result.posts[postId];
      const files: MattermostFile[] = (post.file_ids || []).map(
        (fid: string) => ({
          id: fid,
          userId: post.user_id,
          postId: post.id,
          name: '',
          extension: '',
          size: 0,
          mimeType: '',
          hasPreviewImage: false,
        }),
      );

      return {
        id: post.id,
        text: post.message || '',
        date: post.create_at
          ? new Date(post.create_at).toISOString()
          : null,
        out: post.user_id === botUserId,
        senderId: post.user_id,
        senderName: userMap.get(post.user_id) || 'Unknown',
        replyToId: post.root_id || null,
        files,
      };
    });
  }

  /**
   * Download a file
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const service = getMattermostService();
    return service.downloadFile(fileId);
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<any> {
    const service = getMattermostService();
    const user = await service.getUser(userId);
    return {
      id: user.id,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || null,
      email: user.email || null,
      isBot: user.is_bot || false,
    };
  }
}

// Singleton helper
let instance: MattermostQueryService | null = null;
export function getMattermostQueryService(): MattermostQueryService {
  if (!instance) {
    instance = new MattermostQueryService();
  }
  return instance;
}
