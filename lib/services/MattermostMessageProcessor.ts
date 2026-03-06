import { prisma } from '@/lib/prisma';
import { AIMessageService } from './AIMessageService';
import { getMattermostService } from './MattermostService';
import { CaseCreator } from '@/lib/managers/messaging/CaseCreator';
import {
  checkEmergencyKeywords,
  isWithinBusinessHours,
} from './messaging-utils';
import {
  MattermostDriverMatcher,
  DriverMatchResult,
} from './MattermostDriverMatcher';

/** Patterns that can be classified without AI */
const SKIP_AI_PATTERNS = [
  /^https?:\/\//i,
  /^(ok|okay|thanks|thank you|thx|ty|yes|no|sure|got it|understood|copy|10-4|👍|👌|✅)\.?$/i,
  /^\d{1,6}$/,
  /^[📍📎🖼️🏷️]$/,
];
const MIN_MESSAGE_LENGTH = 4;

/** Batch rapid-fire messages from same sender */
const pendingMessages = new Map<
  string,
  {
    texts: string[];
    timer: ReturnType<typeof setTimeout>;
    post: any;
  }
>();
const BATCH_WINDOW_MS = 8000;

/**
 * Mattermost Message Processor
 * Processes incoming posts through the AI pipeline.
 * Creates breakdown cases automatically and sends responses.
 */
export class MattermostMessageProcessor {
  private companyId: string;
  private aiService: AIMessageService;
  private caseCreator: CaseCreator;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.aiService = new AIMessageService(companyId);
    this.caseCreator = new CaseCreator(companyId);
  }

  private preFilter(
    text: string,
  ): import('./AIMessageService').AIAnalysis | null {
    const trimmed = text.trim();
    if (
      trimmed.length < MIN_MESSAGE_LENGTH ||
      SKIP_AI_PATTERNS.some((p) => p.test(trimmed))
    ) {
      return {
        isBreakdown: false,
        isSafetyIncident: false,
        isMaintenanceRequest: false,
        category: 'OTHER',
        confidence: 0,
        urgency: 'LOW',
        requiresHumanReview: false,
        entities: { truckNumbers: [], locations: [], keywords: [] },
        sentiment: 'NEUTRAL',
        language: 'en',
      };
    }
    return null;
  }

  /**
   * Process an incoming Mattermost post (with batching)
   */
  async processPost(post: any): Promise<void> {
    if (!post.message || post.type) return; // Skip system messages

    const senderId = post.user_id;
    if (!senderId) return;

    // Skip permanently ignored contacts
    const isIgnored =
      await prisma.messagingIgnoredContact.findUnique({
        where: {
          companyId_platform_externalId: {
            companyId: this.companyId,
            platform: 'MATTERMOST',
            externalId: senderId,
          },
        },
      });
    if (isIgnored) return;

    // Batch rapid-fire messages
    const pending = pendingMessages.get(senderId);
    if (pending) {
      pending.texts.push(post.message);
      clearTimeout(pending.timer);
      pending.timer = setTimeout(
        () => this.processBatch(senderId),
        BATCH_WINDOW_MS,
      );
      return;
    }

    pendingMessages.set(senderId, {
      texts: [post.message],
      post,
      timer: setTimeout(
        () => this.processBatch(senderId),
        BATCH_WINDOW_MS,
      ),
    });
  }

  private async processBatch(senderId: string): Promise<void> {
    const batch = pendingMessages.get(senderId);
    if (!batch) return;
    pendingMessages.delete(senderId);

    const combinedText = batch.texts.join('\n');
    try {
      await this.processPostInternal(
        batch.post,
        senderId,
        combinedText,
      );
    } catch (error) {
      console.error(
        '[Mattermost] Error processing batched message:',
        error,
      );
    }
  }

  private async processPostInternal(
    post: any,
    senderId: string,
    messageText: string,
  ): Promise<void> {
    try {
      // Resolve sender name
      let senderName: string | undefined;
      try {
        const service = getMattermostService();
        const user = await service.getUser(senderId);
        senderName =
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
          user.username;
      } catch {
        senderName = undefined;
      }

      console.log(
        `[Mattermost] Processing message from ${senderId}: ${messageText.substring(0, 80)}...`,
      );

      // Pre-filter trivial messages
      const quickResult = this.preFilter(messageText);
      if (quickResult) {
        await prisma.communication.create({
          data: {
            companyId: this.companyId,
            type: 'MESSAGE',
            channel: 'MATTERMOST',
            direction: 'INBOUND',
            content: messageText,
            mattermostPostId: post.id,
            mattermostChannelId: post.channel_id,
            status: 'DELIVERED',
          } as any,
        });
        return;
      }

      // Find driver by Mattermost user ID
      const driverMapping =
        await prisma.mattermostDriverMapping.findUnique({
          where: { mattermostUserId: senderId },
          include: {
            driver: {
              include: {
                user: true,
                currentTruck: true,
              },
            },
          },
        });

      let driver = driverMapping?.driver;
      let autoMatchResult: DriverMatchResult | null = null;

      // Auto-match unlinked users to drivers
      if (!driver) {
        const matcher = new MattermostDriverMatcher(this.companyId);
        autoMatchResult = await matcher.findMatch({
          mattermostUserId: senderId,
          email: driverMapping?.email,
          username: driverMapping?.username,
          firstName:
            driverMapping?.firstName ?? senderName?.split(' ')[0],
          lastName:
            driverMapping?.lastName ??
            senderName?.split(' ').slice(1).join(' '),
        });

        if (autoMatchResult && autoMatchResult.confidence >= 0.85) {
          await prisma.mattermostDriverMapping.upsert({
            where: { mattermostUserId: senderId },
            create: {
              mattermostUserId: senderId,
              driverId: autoMatchResult.driverId,
              email: driverMapping?.email,
              username: driverMapping?.username,
              firstName:
                driverMapping?.firstName ??
                senderName?.split(' ')[0],
              lastName:
                driverMapping?.lastName ??
                senderName?.split(' ').slice(1).join(' '),
              isActive: true,
            },
            update: {
              driverId: autoMatchResult.driverId,
              isActive: true,
            },
          });
          const linkedMapping =
            await prisma.mattermostDriverMapping.findUnique({
              where: { mattermostUserId: senderId },
              include: {
                driver: {
                  include: { user: true, currentTruck: true },
                },
              },
            });
          driver = linkedMapping?.driver;
          console.log(
            `[Mattermost] Auto-linked ${senderId} to driver ${autoMatchResult.driverName} (${autoMatchResult.method}, ${autoMatchResult.confidence})`,
          );
        }
      }

      const driverName = driver?.user
        ? `${driver.user.firstName} ${driver.user.lastName}`
        : 'Unknown User';

      // AI analysis
      const analysis = await this.aiService.analyzeMessage(
        messageText,
        {
          driverId: driver?.id || 'unlinked',
          driverName,
          currentTruck:
            driver?.currentTruck?.truckNumber || 'Unknown',
        },
      );

      // Get settings
      const settings = await prisma.mattermostSettings.findUnique({
        where: { companyId: this.companyId },
      });
      if (!settings) return;

      // Emergency keyword detection
      const isEmergency = checkEmergencyKeywords(
        messageText,
        settings.emergencyKeywords || [],
      );
      if (isEmergency) {
        analysis.urgency = 'CRITICAL';
        analysis.confidence = Math.max(analysis.confidence, 1.0);
        if (
          !analysis.isBreakdown &&
          !analysis.isSafetyIncident &&
          !analysis.isMaintenanceRequest
        ) {
          analysis.isSafetyIncident = true;
          analysis.category = 'SAFETY';
        }
      }

      let caseId: string | undefined;
      let caseNumber: string | undefined;

      // Auto-create or queue for review
      const shouldAutoCreate =
        !!driver &&
        analysis.confidence >= settings.confidenceThreshold &&
        (isEmergency ||
          (settings.autoCreateCases &&
            !settings.requireStaffApproval));

      if (shouldAutoCreate && driver) {
        if (analysis.isBreakdown) {
          const existing = await prisma.breakdown.findFirst({
            where: {
              truckId: driver.currentTruck?.id,
              status: { in: ['REPORTED', 'IN_PROGRESS'] },
            },
          });
          if (!existing) {
            const bd = await this.caseCreator.createBreakdownCase(
              driver.id,
              driver.currentTruck?.id,
              driver.currentTruck?.samsaraId,
              analysis,
              messageText,
            );
            caseId = bd.id;
            caseNumber = bd.breakdownNumber;
          } else {
            caseId = existing.id;
            caseNumber = existing.breakdownNumber;
          }
        } else if (analysis.isSafetyIncident) {
          const existing = await prisma.safetyIncident.findFirst({
            where: {
              driverId: driver.id,
              status: { in: ['REPORTED', 'UNDER_INVESTIGATION'] },
            },
          });
          if (!existing) {
            const si = await this.caseCreator.createSafetyIncident(
              driver.id,
              driver.currentTruck?.id,
              analysis,
              messageText,
            );
            caseId = si.id;
            caseNumber = si.incidentNumber;
          } else {
            caseId = existing.id;
            caseNumber = existing.incidentNumber;
          }
        } else if (analysis.isMaintenanceRequest) {
          const existing = driver.currentTruck?.id
            ? await prisma.maintenanceRecord.findFirst({
                where: {
                  truckId: driver.currentTruck.id,
                  status: { in: ['OPEN', 'IN_PROGRESS'] },
                },
              })
            : null;
          if (!existing) {
            const mr =
              await this.caseCreator.createMaintenanceRequest(
                driver.id,
                driver.currentTruck?.id,
                analysis,
                messageText,
              );
            caseId = mr.id;
            caseNumber = mr.maintenanceNumber || mr.id;
          } else {
            caseId = existing.id;
            caseNumber = existing.maintenanceNumber || existing.id;
          }
        }
      }

      const needsReview =
        !caseId &&
        (analysis.isBreakdown ||
          analysis.isSafetyIncident ||
          analysis.isMaintenanceRequest);

      // Log communication
      const communication = await prisma.communication.create({
        data: {
          companyId: settings.companyId,
          type:
            analysis.category === 'BREAKDOWN'
              ? 'BREAKDOWN_REPORT'
              : 'MESSAGE',
          channel: 'MATTERMOST',
          direction: 'INBOUND',
          content: messageText,
          mattermostPostId: post.id,
          mattermostChannelId: post.channel_id,
          driverId: driver?.id,
          breakdownId: caseId || undefined,
          status: 'DELIVERED',
        } as any,
      });

      await prisma.aIResponseLog.create({
        data: {
          communicationId: communication.id,
          messageContent: messageText,
          aiAnalysis: analysis as any,
          confidence: analysis.confidence,
          requiresReview: analysis.requiresHumanReview,
          wasAutoSent: false,
        },
      });

      // Audit trail for auto-created cases
      if (caseId && shouldAutoCreate) {
        await prisma.messagingReviewItem.create({
          data: {
            companyId: this.companyId,
            platform: 'MATTERMOST',
            type: 'CASE_APPROVAL',
            status: 'APPROVED',
            externalChatId: post.channel_id,
            channelName: undefined,
            senderName:
              driverName !== 'Unknown User'
                ? driverName
                : senderName,
            messageContent: messageText,
            messageDate: new Date(),
            aiCategory: analysis.category,
            aiConfidence: analysis.confidence,
            aiUrgency: analysis.urgency,
            aiAnalysis: analysis as any,
            communicationId: communication.id,
            driverId: driver?.id,
            breakdownId: analysis.isBreakdown
              ? caseId
              : undefined,
            resolvedAt: new Date(),
            resolvedNote: isEmergency
              ? 'Auto-created (emergency keyword)'
              : 'Auto-created by system',
          },
        });
      }

      // Create review queue item
      if (needsReview) {
        const reviewType = !driver
          ? 'DRIVER_LINK_NEEDED'
          : 'CASE_APPROVAL';
        const resolvedSenderName =
          driverName !== 'Unknown User' ? driverName : senderName;
        const suggestion =
          reviewType === 'DRIVER_LINK_NEEDED' &&
          autoMatchResult &&
          autoMatchResult.confidence >= 0.5
            ? autoMatchResult
            : undefined;
        await this.createReviewItem({
          type: reviewType as any,
          channelId: post.channel_id,
          senderName: resolvedSenderName,
          messageContent: messageText,
          analysis,
          communicationId: communication.id,
          driverId: driver?.id,
          suggestedDriverId: suggestion?.driverId,
          matchConfidence: suggestion?.confidence,
          matchMethod: suggestion?.method,
        });
      }

      // Auto-respond logic
      const shouldRespond = await this.shouldAutoRespond(
        settings,
        analysis,
        driverMapping,
      );
      const outsideHours =
        settings.businessHoursOnly &&
        !isWithinBusinessHours(
          settings.businessHoursStart || '09:00',
          settings.businessHoursEnd || '17:00',
          settings.timezone || 'America/Chicago',
        );

      if (shouldRespond) {
        const response = await this.aiService.generateResponse(
          analysis,
          {
            driverName:
              driverMapping?.driver?.user?.firstName || 'Driver',
            caseNumber,
          },
        );
        if (response) {
          await this.sendResponse(
            post.channel_id,
            response,
            communication.id,
            !settings.requireStaffApproval,
          );
        }
      } else if (outsideHours) {
        const afterHoursMsg =
          settings.afterHoursMessage ||
          'We received your message after hours. On-call staff will respond within 15 minutes.';
        await this.sendResponse(
          post.channel_id,
          afterHoursMsg,
          communication.id,
          true,
        );
      } else if (
        analysis.requiresHumanReview ||
        settings.requireStaffApproval
      ) {
        if (!needsReview) {
          const reviewType = driver
            ? 'CASE_APPROVAL'
            : 'DRIVER_LINK_NEEDED';
          const suggestion2 =
            reviewType === 'DRIVER_LINK_NEEDED' &&
            autoMatchResult &&
            autoMatchResult.confidence >= 0.5
              ? autoMatchResult
              : undefined;
          await this.createReviewItem({
            type: reviewType as any,
            channelId: post.channel_id,
            senderName:
              driverName !== 'Unknown User'
                ? driverName
                : senderName,
            messageContent: messageText,
            analysis,
            communicationId: communication.id,
            driverId: driver?.id,
            suggestedDriverId: suggestion2?.driverId,
            matchConfidence: suggestion2?.confidence,
            matchMethod: suggestion2?.method,
          });
        }
      }
    } catch (error) {
      console.error('[Mattermost] Error processing message:', error);
    }
  }

  private async createReviewItem(params: {
    type: 'CASE_APPROVAL' | 'DRIVER_LINK_NEEDED';
    channelId: string;
    senderName?: string;
    messageContent: string;
    analysis: any;
    communicationId: string;
    driverId?: string;
    suggestedDriverId?: string;
    matchConfidence?: number;
    matchMethod?: string;
  }): Promise<void> {
    // Dedup
    const existing = await prisma.messagingReviewItem.findFirst({
      where: {
        externalChatId: params.channelId,
        type: params.type as any,
        status: 'PENDING',
      },
    });
    if (existing) return;

    await prisma.messagingReviewItem.create({
      data: {
        companyId: this.companyId,
        platform: 'MATTERMOST',
        type: params.type as any,
        externalChatId: params.channelId,
        senderName: params.senderName,
        messageContent: params.messageContent,
        messageDate: new Date(),
        aiCategory: params.analysis.category,
        aiConfidence: params.analysis.confidence,
        aiUrgency: params.analysis.urgency,
        aiAnalysis: params.analysis,
        communicationId: params.communicationId,
        driverId: params.driverId,
        suggestedDriverId: params.suggestedDriverId,
        matchConfidence: params.matchConfidence,
        matchMethod: params.matchMethod,
      },
    });
  }

  private async shouldAutoRespond(
    settings: any,
    analysis: any,
    driverMapping: any,
  ): Promise<boolean> {
    if (driverMapping && driverMapping.aiAutoReply === false)
      return false;
    if (driverMapping?.aiAutoReply) return true;

    if (settings.businessHoursOnly) {
      const withinHours = isWithinBusinessHours(
        settings.businessHoursStart || '09:00',
        settings.businessHoursEnd || '17:00',
        settings.timezone || 'America/Chicago',
      );
      if (!withinHours) return false;
    }

    if (!settings.aiAutoResponse) return false;
    if (analysis.requiresHumanReview) return false;
    if (analysis.confidence < (settings.confidenceThreshold || 0.7))
      return false;

    return true;
  }

  private async sendResponse(
    channelId: string,
    responseText: string,
    originalCommId: string,
    wasAutoSent: boolean,
  ): Promise<void> {
    try {
      const service = getMattermostService();
      await service.sendMessage(channelId, responseText);

      await prisma.communication.create({
        data: {
          companyId: this.companyId,
          channel: 'MATTERMOST',
          direction: 'OUTBOUND',
          type: 'MESSAGE',
          content: responseText,
          status: 'SENT',
          mattermostChannelId: channelId,
        } as any,
      });

      await prisma.aIResponseLog.updateMany({
        where: { communicationId: originalCommId },
        data: {
          wasAutoSent,
          responseContent: responseText,
          actualResponse: responseText,
        },
      });
    } catch (error) {
      console.error(
        '[Mattermost] Failed to send response:',
        error,
      );
    }
  }
}
