/**
 * SIP Engine — Browser-only WebRTC softphone via SIP.js
 *
 * Wraps SIP.js SimpleUser to provide a clean API for the TMS softphone.
 * Handles SIP registration, outbound/inbound calls, mute, hold, DTMF, and transfer.
 *
 * IMPORTANT: This module is client-side only (uses browser APIs: window, navigator, HTMLAudioElement).
 * Do NOT import in server components or API routes.
 */

import { SimpleUser } from 'sip.js/lib/platform/web';

export interface SipConfig {
  wssUrl: string;           // e.g. wss://yokopbx.com:8089/ws
  sipDomain: string;        // e.g. yokopbx.com or auto-discovered domain
  sipUser: string;          // extension (e.g. "101")
  sipPassword: string;      // SIP auth password
  displayName?: string;     // User's full name for caller ID
}

export type RegistrationState = 'unregistered' | 'registering' | 'registered' | 'error';
export type CallDirection = 'inbound' | 'outbound';
export type CallState = 'ringing' | 'connected' | 'on-hold' | 'ended';

export interface SipCallState {
  direction: CallDirection;
  remoteNumber: string;
  state: CallState;
  startTime?: Date;
  muted: boolean;
  onHold: boolean;
}

export interface SipEngineCallbacks {
  onRegistrationChange: (state: RegistrationState) => void;
  onCallStateChange: (call: SipCallState | null) => void;
  onIncomingCall: (remoteNumber: string) => void;
  onError: (message: string) => void;
}

const STORAGE_KEY = 'tms_softphone_active_tab';

export class SipEngine {
  private simpleUser: SimpleUser | null = null;
  private callbacks: SipEngineCallbacks;
  private config: SipConfig | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private callTimer: ReturnType<typeof setInterval> | null = null;
  private currentCall: SipCallState | null = null;

  constructor(callbacks: SipEngineCallbacks) {
    this.callbacks = callbacks;
  }

  /** Acquire tab lock to prevent duplicate registrations */
  private acquireTabLock(): boolean {
    const now = Date.now();
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      const ts = parseInt(existing, 10);
      // Stale if older than 30 seconds (tab closed without cleanup)
      if (now - ts < 30000) return false;
    }
    localStorage.setItem(STORAGE_KEY, String(now));
    return true;
  }

  private releaseTabLock(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Keep tab lock alive */
  private tabLockInterval: ReturnType<typeof setInterval> | null = null;

  private startTabLockHeartbeat(): void {
    this.tabLockInterval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }, 10000);
  }

  private stopTabLockHeartbeat(): void {
    if (this.tabLockInterval) {
      clearInterval(this.tabLockInterval);
      this.tabLockInterval = null;
    }
  }

  /** Connect and register with the PBX */
  async connect(config: SipConfig): Promise<void> {
    if (this.simpleUser) {
      await this.disconnect();
    }

    if (!this.acquireTabLock()) {
      this.callbacks.onError('Softphone is active in another tab. Close it first.');
      return;
    }

    this.config = config;
    this.callbacks.onRegistrationChange('registering');

    // Create hidden audio element for remote media
    this.remoteAudioElement = document.createElement('audio');
    this.remoteAudioElement.autoplay = true;
    document.body.appendChild(this.remoteAudioElement);

    const aor = `sip:${config.sipUser}@${config.sipDomain}`;

    try {
      this.simpleUser = new SimpleUser(config.wssUrl, {
        aor,
        media: {
          constraints: { audio: true, video: false },
          remote: { audio: this.remoteAudioElement },
        },
        userAgentOptions: {
          authorizationUsername: config.sipUser,
          authorizationPassword: config.sipPassword,
          displayName: config.displayName || config.sipUser,
          logLevel: 'warn',
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 4,
        delegate: {
          onRegistered: () => {
            this.callbacks.onRegistrationChange('registered');
          },
          onUnregistered: () => {
            this.callbacks.onRegistrationChange('unregistered');
          },
          onServerConnect: () => {
            console.log('[SipEngine] WebSocket connected');
          },
          onServerDisconnect: (error) => {
            if (error) {
              console.error('[SipEngine] WebSocket disconnected with error:', error);
              this.callbacks.onRegistrationChange('error');
              this.callbacks.onError(`Connection lost: ${error.message}`);
            } else {
              this.callbacks.onRegistrationChange('unregistered');
            }
          },
          onCallReceived: () => {
            // Extract caller info from the remote identity
            const remoteNumber = this.extractRemoteNumber();
            this.currentCall = {
              direction: 'inbound',
              remoteNumber,
              state: 'ringing',
              muted: false,
              onHold: false,
            };
            this.callbacks.onCallStateChange({ ...this.currentCall });
            this.callbacks.onIncomingCall(remoteNumber);
          },
          onCallAnswered: () => {
            if (this.currentCall) {
              this.currentCall.state = 'connected';
              this.currentCall.startTime = new Date();
              this.callbacks.onCallStateChange({ ...this.currentCall });
            }
          },
          onCallHangup: () => {
            this.stopCallTimer();
            this.currentCall = null;
            this.callbacks.onCallStateChange(null);
          },
          onCallHold: (held: boolean) => {
            if (this.currentCall) {
              this.currentCall.onHold = held;
              this.currentCall.state = held ? 'on-hold' : 'connected';
              this.callbacks.onCallStateChange({ ...this.currentCall });
            }
          },
        },
      });

      await this.simpleUser.connect();
      await this.simpleUser.register();
      this.startTabLockHeartbeat();
    } catch (error: any) {
      this.callbacks.onRegistrationChange('error');
      this.callbacks.onError(`Failed to connect: ${error.message}`);
      this.releaseTabLock();
    }
  }

  /** Disconnect and unregister */
  async disconnect(): Promise<void> {
    this.stopCallTimer();
    this.stopTabLockHeartbeat();

    if (this.simpleUser) {
      try {
        await this.simpleUser.unregister();
        await this.simpleUser.disconnect();
      } catch (e) {
        console.warn('[SipEngine] Disconnect error:', e);
      }
      this.simpleUser = null;
    }

    if (this.remoteAudioElement) {
      this.remoteAudioElement.remove();
      this.remoteAudioElement = null;
    }

    this.currentCall = null;
    this.releaseTabLock();
    this.callbacks.onRegistrationChange('unregistered');
    this.callbacks.onCallStateChange(null);
  }

  /** Make an outbound call */
  async makeCall(destination: string): Promise<void> {
    if (!this.simpleUser || !this.config) {
      this.callbacks.onError('Softphone not connected');
      return;
    }

    // Clean up destination — strip non-numeric except leading +
    const cleaned = destination.replace(/[^\d+]/g, '');
    const target = `sip:${cleaned}@${this.config.sipDomain}`;

    this.currentCall = {
      direction: 'outbound',
      remoteNumber: cleaned,
      state: 'ringing',
      muted: false,
      onHold: false,
    };
    this.callbacks.onCallStateChange({ ...this.currentCall });

    try {
      await this.simpleUser.call(target);
    } catch (error: any) {
      this.currentCall = null;
      this.callbacks.onCallStateChange(null);
      this.callbacks.onError(`Call failed: ${error.message}`);
    }
  }

  /** Answer an incoming call */
  async answerCall(): Promise<void> {
    if (!this.simpleUser) return;
    try {
      await this.simpleUser.answer();
    } catch (error: any) {
      this.callbacks.onError(`Answer failed: ${error.message}`);
    }
  }

  /** Decline an incoming call */
  async declineCall(): Promise<void> {
    if (!this.simpleUser) return;
    try {
      await this.simpleUser.decline();
      this.currentCall = null;
      this.callbacks.onCallStateChange(null);
    } catch (error: any) {
      this.callbacks.onError(`Decline failed: ${error.message}`);
    }
  }

  /** Hang up the current call */
  async hangup(): Promise<void> {
    if (!this.simpleUser) return;
    try {
      await this.simpleUser.hangup();
    } catch (error: any) {
      // Call may already be ended
      this.currentCall = null;
      this.callbacks.onCallStateChange(null);
    }
  }

  /** Toggle mute */
  toggleMute(): void {
    if (!this.simpleUser || !this.currentCall) return;
    if (this.simpleUser.isMuted()) {
      this.simpleUser.unmute();
      this.currentCall.muted = false;
    } else {
      this.simpleUser.mute();
      this.currentCall.muted = true;
    }
    this.callbacks.onCallStateChange({ ...this.currentCall });
  }

  /** Toggle hold */
  async toggleHold(): Promise<void> {
    if (!this.simpleUser || !this.currentCall) return;
    try {
      if (this.simpleUser.isHeld()) {
        await this.simpleUser.unhold();
      } else {
        await this.simpleUser.hold();
      }
    } catch (error: any) {
      this.callbacks.onError(`Hold failed: ${error.message}`);
    }
  }

  /** Send DTMF tone */
  async sendDtmf(digit: string): Promise<void> {
    if (!this.simpleUser) return;
    try {
      await this.simpleUser.sendDTMF(digit);
    } catch (error: any) {
      this.callbacks.onError(`DTMF failed: ${error.message}`);
    }
  }

  /** Get the current call state */
  getCallState(): SipCallState | null {
    return this.currentCall ? { ...this.currentCall } : null;
  }

  /** Check if connected and registered */
  isRegistered(): boolean {
    return this.simpleUser?.isConnected() ?? false;
  }

  /** Extract remote party number from the SimpleUser session */
  private extractRemoteNumber(): string {
    // SimpleUser doesn't expose the remote identity directly in a clean way
    // The delegate callbacks don't pass caller info, so we return 'Unknown'
    // and the UI can potentially look it up via CDR or NS API
    return 'Unknown';
  }

  private stopCallTimer(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }
}
