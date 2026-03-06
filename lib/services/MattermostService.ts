/**
 * Mattermost Service
 *
 * Core client for communicating with a self-hosted Mattermost instance.
 * Uses Mattermost REST API v4 + WebSocket for real-time message ingestion.
 *
 * Replaces the former TelegramService (MTProto) with a simpler, standards-based approach:
 *  - Bot token authentication (no phone/code flow)
 *  - REST API for CRUD operations
 *  - WebSocket for real-time event listening
 */

import { prisma } from '@/lib/prisma';

interface MattermostConfig {
  serverUrl: string;
  botToken: string;
}

interface WebSocketMessage {
  event: string;
  data: {
    post?: string;
    channel_id?: string;
    sender_name?: string;
    [key: string]: any;
  };
  broadcast: {
    channel_id?: string;
    user_id?: string;
    team_id?: string;
  };
}

export class MattermostService {
  private config: MattermostConfig | null = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private botUserId: string | null = null;
  private messageHandlers: Array<(post: any) => Promise<void>> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Auto-connect using stored settings
   */
  async autoConnect(): Promise<boolean> {
    if (this.isConnected) return true;
    if (this.isConnecting) {
      await new Promise((r) => setTimeout(r, 1000));
      return this.isConnected;
    }

    const config = await this.loadConfig();
    if (!config) return false;

    try {
      this.isConnecting = true;
      await this.connect(config);
      return true;
    } catch (error) {
      console.error('[Mattermost] Auto-connect failed:', error);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Connect to Mattermost with the given config
   */
  async connect(config: MattermostConfig): Promise<void> {
    this.config = config;

    // Verify bot token by fetching bot user info
    const me = await this.apiCall<any>('GET', '/users/me');
    this.botUserId = me.id;
    this.isConnected = true;

    console.log(
      `[Mattermost] Connected as bot: ${me.username} (${me.id})`,
    );

    // Start WebSocket listener
    this.connectWebSocket();

    // Initialize AI processing if enabled
    const settings = await prisma.mattermostSettings.findFirst();
    if (settings && (settings.aiAutoResponse || settings.autoCreateCases)) {
      await this.initializeAIProcessing(settings.companyId);
    }
  }

  /**
   * WebSocket connection for real-time events
   */
  private connectWebSocket(): void {
    if (!this.config) return;

    const wsUrl = this.config.serverUrl
      .replace(/\/+$/, '')
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');

    const url = `${wsUrl}/api/v4/websocket`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // Authenticate
        this.ws?.send(
          JSON.stringify({
            seq: 1,
            action: 'authentication_challenge',
            data: { token: this.config!.botToken },
          }),
        );
        console.log('[Mattermost] WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(
            event.data as string,
          );
          if (msg.event === 'posted' && msg.data.post) {
            const post = JSON.parse(msg.data.post);
            // Skip messages from the bot itself
            if (post.user_id === this.botUserId) return;
            this.handleNewPost(post);
          }
        } catch {
          // Ignore non-JSON messages (ping/pong)
        }
      };

      this.ws.onclose = () => {
        console.log('[Mattermost] WebSocket disconnected');
        // Auto-reconnect after 5 seconds
        if (this.isConnected) {
          this.reconnectTimer = setTimeout(
            () => this.connectWebSocket(),
            5000,
          );
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Mattermost] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[Mattermost] Failed to create WebSocket:', error);
    }
  }

  private async handleNewPost(post: any): Promise<void> {
    for (const handler of this.messageHandlers) {
      try {
        await handler(post);
      } catch (err) {
        console.error('[Mattermost] Handler error:', err);
      }
    }
  }

  onMessage(handler: (post: any) => Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  async initializeAIProcessing(companyId: string): Promise<void> {
    const settings = await prisma.mattermostSettings.findUnique({
      where: { companyId },
    });
    if (
      !settings ||
      (!settings.aiAutoResponse && !settings.autoCreateCases)
    )
      return;

    const { MattermostMessageProcessor } = await import(
      './MattermostMessageProcessor'
    );
    const processor = new MattermostMessageProcessor(companyId);
    this.onMessage(async (post) => processor.processPost(post));
  }

  // ============================================================
  // REST API METHODS
  // ============================================================

  async sendMessage(
    channelId: string,
    message: string,
    options?: { rootId?: string; props?: Record<string, any> },
  ): Promise<any> {
    return this.apiCall('POST', '/posts', {
      channel_id: channelId,
      message,
      root_id: options?.rootId,
      props: options?.props,
    });
  }

  async sendToChannel(
    channelName: string,
    teamId: string,
    message: string,
  ): Promise<any> {
    const channel = await this.getChannelByName(teamId, channelName);
    if (!channel) {
      console.warn(
        `[Mattermost] Channel #${channelName} not found`,
      );
      return null;
    }
    return this.sendMessage(channel.id, message);
  }

  async getChannels(teamId: string): Promise<any[]> {
    return this.apiCall('GET', `/teams/${teamId}/channels`);
  }

  async getChannelByName(
    teamId: string,
    name: string,
  ): Promise<any | null> {
    try {
      return await this.apiCall(
        'GET',
        `/teams/${teamId}/channels/name/${name}`,
      );
    } catch {
      return null;
    }
  }

  async getChannelPosts(
    channelId: string,
    page = 0,
    perPage = 60,
  ): Promise<any> {
    return this.apiCall(
      'GET',
      `/channels/${channelId}/posts?page=${page}&per_page=${perPage}`,
    );
  }

  async getDirectChannel(userId: string): Promise<any> {
    if (!this.botUserId) throw new Error('Bot not connected');
    return this.apiCall('POST', '/channels/direct', [
      this.botUserId,
      userId,
    ]);
  }

  async getUser(userId: string): Promise<any> {
    return this.apiCall('GET', `/users/${userId}`);
  }

  async getUserByUsername(username: string): Promise<any | null> {
    try {
      return await this.apiCall(
        'GET',
        `/users/username/${username}`,
      );
    } catch {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<any | null> {
    try {
      return await this.apiCall('GET', `/users/email/${email}`);
    } catch {
      return null;
    }
  }

  async getUsers(page = 0, perPage = 200): Promise<any[]> {
    return this.apiCall(
      'GET',
      `/users?page=${page}&per_page=${perPage}`,
    );
  }

  async createUser(user: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<any> {
    return this.apiCall('POST', '/users', user);
  }

  async getFileInfo(fileId: string): Promise<any> {
    return this.apiCall('GET', `/files/${fileId}/info`);
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const url = `${this.config!.serverUrl.replace(/\/+$/, '')}/api/v4/files/${fileId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config!.botToken}` },
    });
    if (!response.ok)
      throw new Error(`Failed to download file: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async uploadFile(
    channelId: string,
    fileName: string,
    fileBuffer: Buffer,
  ): Promise<any> {
    const formData = new FormData();
    formData.append('channel_id', channelId);
    formData.append(
      'files',
      new Blob([new Uint8Array(fileBuffer)]),
      fileName,
    );

    const url = `${this.config!.serverUrl.replace(/\/+$/, '')}/api/v4/files`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config!.botToken}` },
      body: formData,
    });
    if (!response.ok)
      throw new Error(`Failed to upload file: ${response.status}`);
    return response.json();
  }

  /**
   * Post a message with interactive buttons (Mattermost "attachments")
   */
  async sendInteractiveMessage(
    channelId: string,
    text: string,
    actions: Array<{
      name: string;
      integration: { url: string; context: Record<string, any> };
    }>,
  ): Promise<any> {
    return this.sendMessage(channelId, text, {
      props: {
        attachments: [
          {
            actions,
          },
        ],
      },
    });
  }

  // ============================================================
  // INCOMING WEBHOOK (for simple notifications)
  // ============================================================

  async sendWebhook(
    webhookUrl: string,
    payload: {
      text?: string;
      channel?: string;
      username?: string;
      icon_url?: string;
      attachments?: any[];
    },
  ): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  }

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================

  isClientConnected(): boolean {
    return this.isConnected;
  }

  getBotUserId(): string | null {
    return this.botUserId;
  }

  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    botUsername: string | null;
    serverUrl: string | null;
    error: string | null;
  }> {
    const settings = await prisma.mattermostSettings.findFirst();
    if (!settings?.serverUrl || !settings?.botToken) {
      return {
        isConnected: false,
        botUsername: null,
        serverUrl: null,
        error: null,
      };
    }

    // If WebSocket isn't connected but credentials exist, auto-reconnect in background
    if (!this.isConnected) {
      this.autoConnect().catch(() => {});
    }

    return {
      isConnected: true, // credentials exist = configured & connected
      botUsername: settings.botUsername || null,
      serverUrl: settings.serverUrl,
      error: settings.connectionError || null,
    };
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.botUserId = null;
    this.messageHandlers = [];
    console.log('[Mattermost] Disconnected');
  }

  async testConnection(
    serverUrl: string,
    botToken: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    try {
      const response = await fetch(`${serverUrl.replace(/\/+$/, '')}/api/v4/users/me`, {
        headers: { Authorization: `Bearer ${botToken}` },
      });
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      const user = await response.json();
      return { success: true, botUsername: user.username };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private async loadConfig(): Promise<MattermostConfig | null> {
    const settings = await prisma.mattermostSettings.findFirst();
    if (!settings?.serverUrl || !settings?.botToken) return null;
    return {
      serverUrl: settings.serverUrl,
      botToken: settings.botToken,
    };
  }

  private async apiCall<T>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    if (!this.config)
      throw new Error('Mattermost not configured');

    const url = `${this.config.serverUrl.replace(/\/+$/, '')}/api/v4${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.botToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Mattermost API error ${response.status}: ${errorText}`,
      );
    }

    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  }
}

// Singleton
const globalForMattermost = globalThis as unknown as {
  mattermostService_v1: MattermostService | undefined;
};

export function getMattermostService(): MattermostService {
  if (!globalForMattermost.mattermostService_v1) {
    globalForMattermost.mattermostService_v1 = new MattermostService();
  }
  return globalForMattermost.mattermostService_v1;
}
