/**
 * MattermostInteractiveManager
 *
 * Handles interactive message attachments (buttons, menus)
 * for Mattermost. Uses Mattermost's native message attachments
 * with integration actions instead of Telegram's inline keyboards.
 */

import { getMattermostService } from './MattermostService';

export interface ActionButton {
  id: string;
  name: string;
  style?: 'default' | 'primary' | 'success' | 'danger';
}

export class MattermostInteractiveManager {
  private callbackUrl: string;

  constructor() {
    this.callbackUrl = `${process.env.NEXTAUTH_URL || ''}/api/mattermost/actions`;
  }

  /**
   * Create a message attachment with action buttons
   */
  createAttachmentWithActions(
    text: string,
    buttons: ActionButton[],
    context: Record<string, any> = {},
  ): any {
    return {
      text,
      actions: buttons.map((btn) => ({
        id: btn.id,
        name: btn.name,
        style: btn.style || 'default',
        integration: {
          url: this.callbackUrl,
          context: { action: btn.id, ...context },
        },
      })),
    };
  }

  /**
   * Send the driver main menu to a channel
   */
  async sendDriverMainMenu(channelId: string): Promise<void> {
    const service = getMattermostService();

    const attachment = this.createAttachmentWithActions(
      'What would you like to do?',
      [
        {
          id: 'driver:current_load',
          name: 'My Current Load',
          style: 'primary',
        },
        {
          id: 'driver:available_loads',
          name: 'Available Loads',
        },
        {
          id: 'driver:breakdown',
          name: 'Report Breakdown',
          style: 'danger',
        },
        {
          id: 'driver:settlements',
          name: 'Settlements',
        },
      ],
    );

    await service.sendMessage(channelId, '', {
      props: { attachments: [attachment] },
    });
  }

  /**
   * Send a confirmation dialog
   */
  async sendConfirmation(
    channelId: string,
    question: string,
    actionPrefix: string,
    context: Record<string, any> = {},
  ): Promise<void> {
    const service = getMattermostService();

    const attachment = this.createAttachmentWithActions(
      question,
      [
        {
          id: `${actionPrefix}:yes`,
          name: 'Yes',
          style: 'success',
        },
        {
          id: `${actionPrefix}:no`,
          name: 'No',
          style: 'danger',
        },
      ],
      context,
    );

    await service.sendMessage(channelId, '', {
      props: { attachments: [attachment] },
    });
  }
}

// Singleton
let instance: MattermostInteractiveManager | null = null;
export function getMattermostInteractiveManager(): MattermostInteractiveManager {
  if (!instance) {
    instance = new MattermostInteractiveManager();
  }
  return instance;
}
