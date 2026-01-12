'use client';

import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

// Turnstile widget type definitions
declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement | string, options: TurnstileOptions) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
            getResponse: (widgetId: string) => string | undefined;
        };
        onTurnstileLoad?: () => void;
    }
}

interface TurnstileOptions {
    sitekey: string;
    callback?: (token: string) => void;
    'error-callback'?: (error: string) => void;
    'expired-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
    action?: string;
    appearance?: 'always' | 'execute' | 'interaction-only';
}

interface TurnstileWidgetProps {
    /** Callback when verification succeeds, receives the token */
    onVerify: (token: string) => void;
    /** Callback when verification fails */
    onError?: (error: string) => void;
    /** Callback when token expires */
    onExpire?: () => void;
    /** Widget theme */
    theme?: 'light' | 'dark' | 'auto';
    /** Widget size */
    size?: 'normal' | 'compact';
    /** Custom action name for analytics */
    action?: string;
    /** Additional class names */
    className?: string;
}

/**
 * Cloudflare Turnstile CAPTCHA Widget
 * 
 * A privacy-friendly CAPTCHA alternative that protects registration forms
 * from bots without disrupting legitimate users.
 * 
 * @example
 * ```tsx
 * <TurnstileWidget
 *   onVerify={(token) => setTurnstileToken(token)}
 *   onError={(error) => setError(error)}
 *   theme="dark"
 * />
 * ```
 */
export function TurnstileWidget({
    onVerify,
    onError,
    onExpire,
    theme = 'auto',
    size = 'normal',
    action,
    className,
}: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const isRenderedRef = useRef(false);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const renderWidget = useCallback(() => {
        if (!window.turnstile || !containerRef.current || isRenderedRef.current) {
            return;
        }

        if (!siteKey) {
            console.warn('[Turnstile] No site key configured');
            // In development, auto-verify with a placeholder token
            if (process.env.NODE_ENV === 'development') {
                onVerify('dev-mode-token');
            }
            return;
        }

        try {
            // Clear any existing widget
            if (widgetIdRef.current) {
                window.turnstile.remove(widgetIdRef.current);
            }

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: onVerify,
                'error-callback': onError,
                'expired-callback': onExpire,
                theme,
                size,
                action,
            });
            isRenderedRef.current = true;
        } catch (error) {
            console.error('[Turnstile] Render error:', error);
            onError?.('Failed to load CAPTCHA');
        }
    }, [siteKey, onVerify, onError, onExpire, theme, size, action]);

    // Render widget when script loads
    useEffect(() => {
        if (window.turnstile) {
            renderWidget();
        } else {
            window.onTurnstileLoad = renderWidget;
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // Ignore cleanup errors
                }
            }
            isRenderedRef.current = false;
        };
    }, [renderWidget]);

    // Development mode: show placeholder
    if (!siteKey && process.env.NODE_ENV === 'development') {
        return (
            <div className={`p-3 border border-dashed border-yellow-500/50 rounded-lg bg-yellow-500/10 text-center text-sm text-yellow-400 ${className}`}>
                <span className="opacity-70">🔧 CAPTCHA (dev mode - auto-verified)</span>
            </div>
        );
    }

    return (
        <>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
                strategy="lazyOnload"
                async
                defer
            />
            <div
                ref={containerRef}
                className={className}
                data-testid="turnstile-widget"
            />
        </>
    );
}

/**
 * Reset the Turnstile widget (e.g., after form submission error)
 */
export function resetTurnstile(widgetId: string) {
    if (window.turnstile && widgetId) {
        window.turnstile.reset(widgetId);
    }
}
