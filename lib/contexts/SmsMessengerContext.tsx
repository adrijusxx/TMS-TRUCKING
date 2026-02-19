'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface SmsMessengerLead {
    leadId: string;
    leadName: string;
    leadPhone: string;
}

interface SmsMessengerContextType {
    activeLead: SmsMessengerLead | null;
    openSmsMessenger: (lead: SmsMessengerLead) => void;
    closeSmsMessenger: () => void;
}

const SmsMessengerContext = createContext<SmsMessengerContextType | undefined>(undefined);

export function SmsMessengerProvider({ children }: { children: ReactNode }) {
    const [activeLead, setActiveLead] = useState<SmsMessengerLead | null>(null);

    const openSmsMessenger = useCallback((lead: SmsMessengerLead) => {
        setActiveLead(lead);
    }, []);

    const closeSmsMessenger = useCallback(() => {
        setActiveLead(null);
    }, []);

    return (
        <SmsMessengerContext.Provider value={{ activeLead, openSmsMessenger, closeSmsMessenger }}>
            {children}
        </SmsMessengerContext.Provider>
    );
}

export function useSmsMessenger() {
    const context = useContext(SmsMessengerContext);
    if (!context) {
        throw new Error('useSmsMessenger must be used within SmsMessengerProvider');
    }
    return context;
}
