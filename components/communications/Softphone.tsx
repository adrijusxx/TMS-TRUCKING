'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSoftphone } from '@/lib/contexts/SoftphoneContext';
import {
  Phone, PhoneOff, PhoneIncoming, PhoneOutgoing,
  Mic, MicOff, Pause, Play, X, Minus,
  Maximize2, Hash, ArrowRightLeft, Delete,
} from 'lucide-react';

const DIAL_PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

function formatDuration(startTime: Date | undefined): string {
  if (!startTime) return '00:00';
  const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

type SoftphoneView = 'collapsed' | 'expanded' | 'minimized';

export default function Softphone() {
  const {
    registrationState, currentCall, isEnabled, error, pendingDial,
    makeCall, dialAndOpen, clearPendingDial, answerCall, declineCall, hangup,
    toggleMute, toggleHold, sendDtmf, connect,
  } = useSoftphone();

  const [view, setView] = useState<SoftphoneView>('collapsed');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDtmf, setShowDtmf] = useState(false);
  const [duration, setDuration] = useState('00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update call duration timer
  useEffect(() => {
    if (currentCall?.state === 'connected' && currentCall.startTime) {
      timerRef.current = setInterval(() => {
        setDuration(formatDuration(currentCall.startTime));
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setDuration('00:00');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [currentCall?.state, currentCall?.startTime]);

  // Auto-expand on incoming call
  useEffect(() => {
    if (currentCall?.direction === 'inbound' && currentCall?.state === 'ringing') {
      setView('expanded');
    }
  }, [currentCall?.direction, currentCall?.state]);

  // Handle pendingDial — auto-open and dial
  useEffect(() => {
    if (!pendingDial) return;
    setPhoneNumber(pendingDial);
    setView('expanded');
    if (registrationState === 'registered') {
      makeCall(pendingDial);
    }
    clearPendingDial();
  }, [pendingDial, registrationState, makeCall, clearPendingDial]);

  // Don't render if softphone is not enabled
  if (!isEnabled) return null;

  const handleDial = (digit: string) => {
    if (currentCall?.state === 'connected') {
      sendDtmf(digit);
    } else {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) return;
    await makeCall(phoneNumber.trim());
    setView('expanded');
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const regColor = registrationState === 'registered'
    ? 'bg-green-500'
    : registrationState === 'registering'
    ? 'bg-yellow-500'
    : registrationState === 'error'
    ? 'bg-red-500'
    : 'bg-gray-400';

  // Collapsed: Just a floating phone button
  if (view === 'collapsed') {
    return (
      <div className="fixed bottom-6 right-20 z-[48]">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg relative"
          onClick={() => setView('expanded')}
          title={`Softphone (${registrationState})`}
        >
          <Phone className="h-5 w-5" />
          <span className={cn('absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-background', regColor)} />
        </Button>
        {error && (
          <div className="absolute bottom-14 right-0 w-56 bg-destructive/90 text-destructive-foreground text-xs p-2 rounded shadow">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Minimized: Small bar
  if (view === 'minimized') {
    return (
      <div className="fixed bottom-6 right-20 z-[48]">
        <div
          className="flex items-center gap-2 bg-card border rounded-lg shadow-lg px-3 py-2 cursor-pointer hover:bg-accent/50"
          onClick={() => setView('expanded')}
        >
          <span className={cn('h-2.5 w-2.5 rounded-full', regColor)} />
          <Phone className="h-4 w-4" />
          <span className="text-sm font-medium">
            {currentCall ? `${currentCall.remoteNumber} — ${duration}` : 'Softphone'}
          </span>
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Expanded: Full softphone card
  return (
    <div className="fixed bottom-6 right-20 z-[48]">
      <Card className="w-[320px] shadow-2xl border-2">
        {/* Header */}
        <CardHeader className="py-2.5 px-3 flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', regColor)} />
            <span className="text-sm font-semibold">Softphone</span>
            {registrationState === 'error' && (
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={connect}>
                Retry
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView('minimized')}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView('collapsed')}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 space-y-3">
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {/* Incoming Call View */}
          {currentCall?.direction === 'inbound' && currentCall?.state === 'ringing' && (
            <IncomingCallView
              remoteNumber={currentCall.remoteNumber}
              onAnswer={answerCall}
              onDecline={declineCall}
            />
          )}

          {/* Active Call View */}
          {currentCall && currentCall.state !== 'ringing' && (
            <ActiveCallView
              call={currentCall}
              duration={duration}
              showDtmf={showDtmf}
              onToggleDtmf={() => setShowDtmf(!showDtmf)}
              onDial={handleDial}
              onMute={toggleMute}
              onHold={toggleHold}
              onHangup={hangup}
            />
          )}

          {/* Idle View — Dialpad */}
          {!currentCall && (
            <IdleView
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              onDial={handleDial}
              onBackspace={handleBackspace}
              onCall={handleCall}
              registrationState={registrationState}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Incoming call notification */
function IncomingCallView({
  remoteNumber, onAnswer, onDecline,
}: { remoteNumber: string; onAnswer: () => void; onDecline: () => void }) {
  return (
    <div className="text-center space-y-4 py-4">
      <PhoneIncoming className="h-10 w-10 mx-auto text-green-500 animate-bounce" />
      <div>
        <p className="text-sm font-semibold">Incoming Call</p>
        <p className="text-lg font-mono">{remoteNumber}</p>
      </div>
      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full h-14 w-14"
          onClick={onDecline}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
          onClick={onAnswer}
        >
          <Phone className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

/** Active call controls */
function ActiveCallView({
  call, duration, showDtmf,
  onToggleDtmf, onDial, onMute, onHold, onHangup,
}: {
  call: NonNullable<ReturnType<typeof useSoftphone>['currentCall']>;
  duration: string;
  showDtmf: boolean;
  onToggleDtmf: () => void;
  onDial: (d: string) => void;
  onMute: () => void;
  onHold: () => Promise<void>;
  onHangup: () => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      {/* Call info */}
      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {call.direction === 'outbound' ? (
            <PhoneOutgoing className="h-3.5 w-3.5" />
          ) : (
            <PhoneIncoming className="h-3.5 w-3.5" />
          )}
          <span>{call.state === 'on-hold' ? 'On Hold' : call.state}</span>
        </div>
        <p className="text-lg font-mono font-semibold mt-1">{call.remoteNumber}</p>
        <p className="text-2xl font-mono text-primary">{duration}</p>
      </div>

      {/* DTMF pad overlay */}
      {showDtmf && (
        <div className="grid grid-cols-3 gap-1.5">
          {DIAL_PAD.flat().map((digit) => (
            <Button
              key={digit}
              variant="outline"
              size="sm"
              className="h-10 text-base font-mono"
              onClick={() => onDial(digit)}
            >
              {digit}
            </Button>
          ))}
        </div>
      )}

      {/* Control buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={call.muted ? 'default' : 'outline'}
          size="sm"
          className="flex-col h-14 gap-1"
          onClick={onMute}
        >
          {call.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          <span className="text-[10px]">{call.muted ? 'Unmute' : 'Mute'}</span>
        </Button>

        <Button
          variant={call.onHold ? 'default' : 'outline'}
          size="sm"
          className="flex-col h-14 gap-1"
          onClick={onHold}
        >
          {call.onHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          <span className="text-[10px]">{call.onHold ? 'Resume' : 'Hold'}</span>
        </Button>

        <Button
          variant={showDtmf ? 'default' : 'outline'}
          size="sm"
          className="flex-col h-14 gap-1"
          onClick={onToggleDtmf}
        >
          <Hash className="h-4 w-4" />
          <span className="text-[10px]">Keypad</span>
        </Button>
      </div>

      {/* Hangup button */}
      <Button
        variant="destructive"
        className="w-full h-12"
        onClick={onHangup}
      >
        <PhoneOff className="h-5 w-5 mr-2" />
        End Call
      </Button>
    </div>
  );
}

/** Idle dial pad */
function IdleView({
  phoneNumber, onPhoneNumberChange, onDial, onBackspace, onCall, registrationState,
}: {
  phoneNumber: string;
  onPhoneNumberChange: (v: string) => void;
  onDial: (d: string) => void;
  onBackspace: () => void;
  onCall: () => void;
  registrationState: string;
}) {
  return (
    <div className="space-y-3">
      {/* Phone number input */}
      <div className="relative">
        <Input
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder="Enter number..."
          className="text-center text-lg font-mono pr-10"
          onKeyDown={(e) => { if (e.key === 'Enter') onCall(); }}
        />
        {phoneNumber && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={onBackspace}
          >
            <Delete className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dial pad */}
      <div className="grid grid-cols-3 gap-1.5">
        {DIAL_PAD.flat().map((digit) => (
          <Button
            key={digit}
            variant="outline"
            className="h-12 text-lg font-mono"
            onClick={() => onDial(digit)}
          >
            {digit}
          </Button>
        ))}
      </div>

      {/* Call button */}
      <Button
        className="w-full h-12 bg-green-600 hover:bg-green-700"
        onClick={onCall}
        disabled={!phoneNumber.trim() || registrationState !== 'registered'}
      >
        <Phone className="h-5 w-5 mr-2" />
        {registrationState !== 'registered' ? 'Not Connected' : 'Call'}
      </Button>
    </div>
  );
}
