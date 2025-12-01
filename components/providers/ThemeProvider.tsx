'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'amber' | 'system';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | 'amber';
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'amber'>('light');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [compactMode, setCompactModeState] = useState(false);
  const [reduceMotion, setReduceMotionState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedFontSize = localStorage.getItem('fontSize') as FontSize | null;
    const storedCompactMode = localStorage.getItem('compactMode') === 'true';
    const storedReduceMotion = localStorage.getItem('reduceMotion') === 'true';

    if (storedTheme) {
      setThemeState(storedTheme);
    }
    if (storedFontSize) {
      setFontSizeState(storedFontSize);
    }
    if (storedCompactMode) {
      setCompactModeState(storedCompactMode);
    }
    if (storedReduceMotion) {
      setReduceMotionState(storedReduceMotion);
    }
    setMounted(true);
  }, []);

  // Apply theme
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'amber');

    let effectiveTheme: 'light' | 'dark' | 'amber' = 'light';
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemPrefersDark ? 'dark' : 'light';
    } else if (theme === 'light' || theme === 'dark' || theme === 'amber') {
      effectiveTheme = theme;
    } else {
      // Fallback to light if theme is invalid
      effectiveTheme = 'light';
    }

    // Only add theme class if it's valid and not empty
    if (effectiveTheme && effectiveTheme.trim() !== '') {
      root.classList.add(effectiveTheme);
      setResolvedTheme(effectiveTheme);
    }
  }, [theme, mounted]);

  // Apply font size
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    const fontSizeMap = {
      small: '0.875rem',   // 14px
      medium: '1rem',      // 16px (default)
      large: '1.125rem',   // 18px
    };
    
    root.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
  }, [fontSize, mounted]);

  // Apply compact mode
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [compactMode, mounted]);

  // Apply reduce motion
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reduceMotion, mounted]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark', 'amber');
      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      if (newTheme && newTheme.trim() !== '') {
        root.classList.add(newTheme);
        setResolvedTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


  // Always render the provider, even during SSR, with default values
  // This prevents "useTheme must be used within a ThemeProvider" errors
  return (
    <ThemeContext.Provider
      value={{
        theme: mounted ? theme : 'system',
        setTheme: (newTheme: Theme) => {
          if (mounted) {
            setThemeState(newTheme);
            localStorage.setItem('theme', newTheme);
          }
        },
        resolvedTheme: mounted ? resolvedTheme : ('light' as 'light' | 'dark' | 'amber'),
        fontSize: mounted ? fontSize : 'medium',
        setFontSize: (size: FontSize) => {
          if (mounted) {
            setFontSizeState(size);
            localStorage.setItem('fontSize', size);
          }
        },
        compactMode: mounted ? compactMode : false,
        setCompactMode: (compact: boolean) => {
          if (mounted) {
            setCompactModeState(compact);
            localStorage.setItem('compactMode', String(compact));
          }
        },
        reduceMotion: mounted ? reduceMotion : false,
        setReduceMotion: (reduce: boolean) => {
          if (mounted) {
            setReduceMotionState(reduce);
            localStorage.setItem('reduceMotion', String(reduce));
          }
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
