/**
 * TelegramKeyboardManager
 * 
 * Handles generation of dynamic keyboards, reply markups, 
 * and interactive menus for Telegram.
 */

import { Api } from 'telegram/tl';

export interface KeyboardButton {
    text: string;
    data: string;
}

export class TelegramKeyboardManager {
    /**
     * Create an inline keyboard with multiple buttons
     */
    createInlineKeyboard(buttons: KeyboardButton[][]): Api.ReplyInlineMarkup {
        const rows = buttons.map(row => {
            return new Api.ReplyInlineMarkup({
                rows: row.map(btn => new Api.KeyboardButtonRow({
                    buttons: [new Api.KeyboardButtonCallback({
                        text: btn.text,
                        data: Buffer.from(btn.data)
                    })]
                }))
            });
        });

        // Note: MTProto Inline Keyboard structure is slightly different 
        // from Bot API. We use Api.ReplyInlineMarkup which contains an array of KeyboardButtonRow.

        return new Api.ReplyInlineMarkup({
            rows: buttons.map(row => new Api.KeyboardButtonRow({
                buttons: row.map(btn => new Api.KeyboardButtonCallback({
                    text: btn.text,
                    data: Buffer.from(btn.data)
                }))
            }))
        });
    }

    /**
     * Standard Driver Menu keyboard
     */
    getDriverMainMenu(): Api.ReplyInlineMarkup {
        return this.createInlineKeyboard([
            [
                { text: '🚚 My Current Load', data: 'driver:current_load' },
                { text: '📋 Available Loads', data: 'driver:available_loads' }
            ],
            [
                { text: '🔧 Report Breakdown', data: 'driver:breakdown' },
                { text: '💰 Settlements', data: 'driver:settlements' }
            ],
            [
                { text: '⚙️ Settings', data: 'driver:settings' }
            ]
        ]);
    }

    /**
     * Confirmation keyboard (Yes/No)
     */
    getConfirmationKeyboard(baseAction: string): Api.ReplyInlineMarkup {
        return this.createInlineKeyboard([
            [
                { text: '✅ Yes', data: `${baseAction}:yes` },
                { text: '❌ No', data: `${baseAction}:no` }
            ]
        ]);
    }
}

// Singleton helper
let instance: TelegramKeyboardManager | null = null;
export function getTelegramKeyboardManager(): TelegramKeyboardManager {
    if (!instance) {
        instance = new TelegramKeyboardManager();
    }
    return instance;
}
