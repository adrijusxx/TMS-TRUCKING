'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { SipCallState, RegistrationState, SipConfig } from '@/lib/integrations/netsapiens/sip-engine';

interface SoftphoneContextType {
  // State
  registrationState: RegistrationState;
  currentCall: SipCallState | null;
  isEnabled: boolean;
  error: string | null;
  pendingDial: string | null;
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  makeCall: (destination: string) => Promise<void>;
  dialAndOpen: (destination: string) => void;
  clearPendingDial: () => void;
  answerCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  hangup: () => Promise<void>;
  toggleMute: () => void;
  toggleHold: () => Promise<void>;
  sendDtmf: (digit: string) => Promise<void>;
}

const SoftphoneContext = createContext<SoftphoneContextType | undefined>(undefined);

export function SoftphoneProvider({ children }: { children: ReactNode }) {
  const [registrationState, setRegistrationState] = useState<RegistrationState>('unregistered');
  const [currentCall, setCurrentCall] = useState<SipCallState | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDial, setPendingDial] = useState<string | null>(null);
  const engineRef = useRef<any>(null);
  const configFetched = useRef(false);

  // Lazy-load SipEngine (browser-only module)
  const getEngine = useCallback(async () => {
    if (engineRef.current) return engineRef.current;
    const { SipEngine } = await import('@/lib/integrations/netsapiens/sip-engine');
    const engine = new SipEngine({
      onRegistrationChange: setRegistrationState,
      onCallStateChange: setCurrentCall,
      onIncomingCall: (num) => {
        console.log('[Softphone] Incoming call from:', num);
      },
      onError: (msg) => {
        setError(msg);
        // Auto-clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      },
    });
    engineRef.current = engine;
    return engine;
  }, []);

  // Fetch WebRTC config on mount and auto-connect if enabled
  useEffect(() => {
    if (configFetched.current) return;
    configFetched.current = true;

    (async () => {
      try {
        const res = await fetch('/api/integrations/netsapiens/webrtc-config');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.enabled) return;

        setIsEnabled(true);
        const engine = await getEngine();
        const config: SipConfig = {
          wssUrl: data.wssUrl,
          sipDomain: data.sipDomain,
          sipUser: data.sipUser,
          sipPassword: data.sipPassword,
          displayName: data.displayName,
        };
        await engine.connect(config);
      } catch (err) {
        console.debug('[Softphone] Auto-connect skipped:', err);
      }
    })();

    return () => {
      engineRef.current?.disconnect();
    };
  }, [getEngine]);

  const connect = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/netsapiens/webrtc-config');
      if (!res.ok) throw new Error('Failed to fetch config');
      const data = await res.json();
      if (!data.enabled) {
        setError(data.reason || 'Softphone not enabled');
        return;
      }
      const engine = await getEngine();
      await engine.connect({
        wssUrl: data.wssUrl,
        sipDomain: data.sipDomain,
        sipUser: data.sipUser,
        sipPassword: data.sipPassword,
        displayName: data.displayName,
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, [getEngine]);

  const disconnect = useCallback(() => {
    engineRef.current?.disconnect();
  }, []);

  const makeCall = useCallback(async (destination: string) => {
    const engine = await getEngine();
    await engine.makeCall(destination);
  }, [getEngine]);

  const answerCall = useCallback(async () => {
    const engine = await getEngine();
    await engine.answerCall();
  }, [getEngine]);

  const declineCall = useCallback(async () => {
    const engine = await getEngine();
    await engine.declineCall();
  }, [getEngine]);

  const hangup = useCallback(async () => {
    const engine = await getEngine();
    await engine.hangup();
  }, [getEngine]);

  const toggleMute = useCallback(() => {
    engineRef.current?.toggleMute();
  }, []);

  const toggleHold = useCallback(async () => {
    const engine = await getEngine();
    await engine.toggleHold();
  }, [getEngine]);

  const sendDtmf = useCallback(async (digit: string) => {
    const engine = await getEngine();
    await engine.sendDtmf(digit);
  }, [getEngine]);

  const dialAndOpen = useCallback((destination: string) => {
    setPendingDial(destination);
  }, []);

  const clearPendingDial = useCallback(() => {
    setPendingDial(null);
  }, []);

  return (
    <SoftphoneContext.Provider
      value={{
        registrationState,
        currentCall,
        isEnabled,
        error,
        pendingDial,
        connect,
        disconnect,
        makeCall,
        dialAndOpen,
        clearPendingDial,
        answerCall,
        declineCall,
        hangup,
        toggleMute,
        toggleHold,
        sendDtmf,
      }}
    >
      {children}
    </SoftphoneContext.Provider>
  );
}

export function useSoftphone() {
  const context = useContext(SoftphoneContext);
  if (!context) {
    throw new Error('useSoftphone must be used within SoftphoneProvider');
  }
  return context;
}
