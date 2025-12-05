'use client';

/**
 * PWA Install Banner
 * 
 * Prompts users to install the app on their home screen.
 */

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    
    if (success) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
            <Smartphone className="h-6 w-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install TMS Driver</h3>
            <p className="text-xs text-white/80 mt-0.5">
              Add to home screen for quick access & offline support
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-white text-blue-600 hover:bg-white/90"
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? (
              'Installing...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Install App
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={handleDismiss}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}





